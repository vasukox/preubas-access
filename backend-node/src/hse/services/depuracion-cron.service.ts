import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { HseContratista } from '../entities/hse-contratista.entity';
import { HseSolicitudArchivado } from '../entities/hse-solicitud-archivado.entity';
import { Usuario } from '../../auth/entities/usuario.entity';
import { UsuarioRol } from '../../auth/entities/usuario-rol.entity';
import { Rol } from '../../auth/entities/rol.entity';
import {
  EstadoContratista,
  SolicitudArchivadoEstado,
  TipoContratista,
  CumplimientoEstado,
  TipoAcceso,
} from '../../common/enums/hse.enum';
import { RolNombre } from '../../common/enums/rol.enum';
import { NotificacionesService } from '../../notificaciones/notificaciones.service';

@Injectable()
export class DepuracionCronService {
  private readonly logger = new Logger(DepuracionCronService.name);

  constructor(
    @InjectRepository(HseContratista)
    private readonly contratistaRepo: Repository<HseContratista>,
    @InjectRepository(HseSolicitudArchivado)
    private readonly solicitudRepo: Repository<HseSolicitudArchivado>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(UsuarioRol)
    private readonly usuarioRolRepo: Repository<UsuarioRol>,
    @InjectRepository(Rol)
    private readonly rolRepo: Repository<Rol>,
    private readonly notificacionesService: NotificacionesService,
  ) {}

  // Ejecuta diariamente a las 08:00 — usar @Cron requiere ScheduleModule activo.
  // El decorador se activa en onModuleInit via setInterval para evitar dependencia
  // de @nestjs/schedule en el package.json actual. Si se instala @nestjs/schedule,
  // reemplaza el método onModuleInit por:
  //   @Cron('0 8 * * *') async ejecutarDepuracion() { ... }
  onModuleInit() {
    // Primera ejecución al arrancar (evita esperar hasta las 08:00)
    void this.ejecutarDepuracion();

    // Intervalo diario: 24 horas
    setInterval(() => void this.ejecutarDepuracion(), 24 * 60 * 60 * 1000);
  }

  async ejecutarDepuracion(): Promise<void> {
    this.logger.log(
      '[CRON] Iniciando depuracion de contratistas para archivado',
    );

    try {
      const candidatos = await this.buscarCandidatosArchivado();
      this.logger.log(`[CRON] Candidatos encontrados: ${candidatos.length}`);

      if (candidatos.length === 0) return;

      const usuariosHseAdmin = await this.buscarUsuariosHseAdmin();

      for (const contratista of candidatos) {
        await this.procesarCandidato(contratista, usuariosHseAdmin);
      }

      this.logger.log('[CRON] Depuracion completada');
    } catch (err) {
      this.logger.error('[CRON] Error en depuracion de archivado', err);
    }
  }

  private async buscarCandidatosArchivado(): Promise<HseContratista[]> {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    manana.setHours(23, 59, 59, 999);

    // Contratistas APROBADO cuya autorizacion vence mañana o antes,
    // tipo NORMAL o ALTO_RIESGO, sin solicitud PENDIENTE o APROBADO activa.
    const candidatos = await this.contratistaRepo
      .createQueryBuilder('c')
      .innerJoinAndSelect('c.autorizacion', 'a')
      .leftJoinAndSelect('c.accesos', 'ac')
      .leftJoinAndSelect('c.cumplimientos', 'cu')
      .where('c.estado = :estado', { estado: EstadoContratista.APROBADO })
      .andWhere('a.tipo_contratista IN (:...tipos)', {
        tipos: [TipoContratista.NORMAL, TipoContratista.ALTO_RIESGO],
      })
      .andWhere('a.fecha_fin <= :manana', { manana })
      .andWhere('c.deleted_at IS NULL')
      .andWhere('a.deleted_at IS NULL')
      .getMany();

    // Filtrar en memoria: solo contratistas con al menos 1 acceso ENTRADA + 1 SALIDA
    // y al menos 1 cumplimiento COMPLETADO y sin solicitud activa
    const filtrados: HseContratista[] = [];

    for (const contratista of candidatos) {
      const tieneEntrada = contratista.accesos?.some(
        (acc) => acc.tipoAcceso === TipoAcceso.ENTRADA,
      );
      const tieneSalida = contratista.accesos?.some(
        (acc) => acc.tipoAcceso === TipoAcceso.SALIDA,
      );
      const tieneCumplimientoCompletado = contratista.cumplimientos?.some(
        (cum) => cum.estado === CumplimientoEstado.COMPLETADO,
      );

      if (!tieneEntrada || !tieneSalida || !tieneCumplimientoCompletado) {
        continue;
      }

      const solicitudActiva = await this.solicitudRepo.findOne({
        where: {
          contratistaId: contratista.id,
          estado: In([
            SolicitudArchivadoEstado.PENDIENTE,
            SolicitudArchivadoEstado.APROBADO,
          ]),
        },
      });

      if (!solicitudActiva) {
        filtrados.push(contratista);
      }
    }

    return filtrados;
  }

  private async buscarUsuariosHseAdmin(): Promise<Usuario[]> {
    const rolesObjetivo = await this.rolRepo.find({
      where: {
        nombre: In([
          RolNombre.ADMIN_HSE,
          RolNombre.GESTION_HSE,
          RolNombre.ADMIN_GLOBAL,
        ]),
        activo: true,
      },
    });

    if (rolesObjetivo.length === 0) return [];

    const rolIds = rolesObjetivo.map((r) => r.id);

    const usuarioRoles = await this.usuarioRolRepo.find({
      where: { rolId: In(rolIds) },
      relations: ['usuario'],
    });

    const usuarios = usuarioRoles
      .map((ur) => ur.usuario)
      .filter((u) => u && u.activo && !u.deleted_at);

    // Deduplicar por ID
    const vistos = new Set<number>();
    return usuarios.filter((u) => {
      if (vistos.has(u.id)) return false;
      vistos.add(u.id);
      return true;
    });
  }

  private async procesarCandidato(
    contratista: HseContratista,
    usuariosHseAdmin: Usuario[],
  ): Promise<void> {
    try {
      const solicitud = this.solicitudRepo.create({
        contratistaId: contratista.id,
        estado: SolicitudArchivadoEstado.PENDIENTE,
        notificacionEnviada: false,
      });

      const solicitudGuardada = await this.solicitudRepo.save(solicitud);

      const nombreContratista = `${contratista.nombres} ${contratista.apellidos}`;
      const titulo = 'Solicitud de archivado pendiente';
      const mensaje =
        `El contratista ${nombreContratista} (doc: ${contratista.numeroDocumento}) ` +
        `tiene autorización próxima a vencer y cumple los criterios para archivado. ` +
        `Se requiere revisión y aprobación.`;

      const notificaciones = usuariosHseAdmin.map((usuario) =>
        this.notificacionesService.crear(
          usuario.id,
          'ARCHIVADO_PENDIENTE',
          titulo,
          mensaje,
          {
            contratistaId: contratista.id,
            solicitudArchivadoId: solicitudGuardada.id,
            autorizacionId: contratista.autorizacionId,
          },
        ),
      );

      await Promise.all(notificaciones);

      solicitudGuardada.notificacionEnviada = true;
      await this.solicitudRepo.save(solicitudGuardada);

      this.logger.log(
        `[CRON] Solicitud archivado creada — contratistaId=${contratista.id} ` +
          `notificacionesEnviadas=${usuariosHseAdmin.length}`,
      );
    } catch (err) {
      this.logger.error(
        `[CRON] Error procesando candidato contratistaId=${contratista.id}`,
        err,
      );
    }
  }
}
