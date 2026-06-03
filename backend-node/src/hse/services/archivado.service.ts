import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, Not } from 'typeorm';
import { HseContratista } from '../entities/hse-contratista.entity';
import { HseSolicitudArchivado } from '../entities/hse-solicitud-archivado.entity';
import {
  EstadoContratista,
  SolicitudArchivadoEstado,
} from '../../common/enums/hse.enum';
import { NotificacionesService } from '../../notificaciones/notificaciones.service';

interface ElegibilidadResult {
  elegible: boolean;
  razon?: string;
}

@Injectable()
export class ArchivadoService {
  private readonly logger = new Logger(ArchivadoService.name);

  constructor(
    @InjectRepository(HseContratista)
    private readonly contratistaRepo: Repository<HseContratista>,
    @InjectRepository(HseSolicitudArchivado)
    private readonly solicitudRepo: Repository<HseSolicitudArchivado>,
    private readonly dataSource: DataSource,
    private readonly notificacionesService: NotificacionesService,
  ) {}

  async evaluarElegibilidad(
    contratistaId: number,
  ): Promise<ElegibilidadResult> {
    const contratista = await this.contratistaRepo.findOne({
      where: { id: contratistaId },
      relations: ['autorizacion', 'accesos', 'cumplimientos'],
    });

    if (!contratista) {
      return { elegible: false, razon: 'Contratista no encontrado' };
    }

    if (contratista.estado !== EstadoContratista.APROBADO) {
      return {
        elegible: false,
        razon: `El contratista debe estar en estado APROBADO. Estado actual: ${contratista.estado}`,
      };
    }

    const solicitudActiva = await this.solicitudRepo.findOne({
      where: {
        contratistaId,
        estado: In([
          SolicitudArchivadoEstado.PENDIENTE,
          SolicitudArchivadoEstado.APROBADO,
        ]),
      },
    });

    if (solicitudActiva) {
      return {
        elegible: false,
        razon: `Ya existe una solicitud de archivado con estado ${solicitudActiva.estado}`,
      };
    }

    return { elegible: true };
  }

  async obtenerCola(): Promise<HseSolicitudArchivado[]> {
    return this.solicitudRepo.find({
      where: { estado: SolicitudArchivadoEstado.PENDIENTE },
      relations: [
        'contratista',
        'contratista.autorizacion',
        'contratista.autorizacion.proveedor',
        'resolutor',
      ],
      order: { created_at: 'ASC' },
    });
  }

  async aprobarArchivado(
    contratistaId: number,
    usuarioId: number,
    motivo: string,
    firmaDigital: string,
  ): Promise<HseSolicitudArchivado> {
    const solicitud = await this.solicitudRepo.findOne({
      where: { contratistaId, estado: SolicitudArchivadoEstado.PENDIENTE },
    });

    if (!solicitud) {
      throw new NotFoundException(
        `No existe solicitud de archivado pendiente para el contratista ${contratistaId}`,
      );
    }

    const contratista = await this.contratistaRepo.findOne({
      where: { id: contratistaId },
    });

    if (!contratista) {
      throw new NotFoundException(`Contratista ${contratistaId} no encontrado`);
    }

    const resultado = await this.dataSource.transaction(async (manager) => {
      solicitud.estado = SolicitudArchivadoEstado.APROBADO;
      solicitud.motivo = motivo;
      solicitud.firmaDigital = firmaDigital;
      solicitud.resolvidoPor = usuarioId;
      solicitud.fechaResolucion = new Date();

      contratista.estado = EstadoContratista.ARCHIVADO;

      await manager.save(HseSolicitudArchivado, solicitud);
      await manager.save(HseContratista, contratista);

      this.logger.log(
        `[AUDIT] Archivado aprobado — contratistaId=${contratistaId} resolvidoPor=${usuarioId}`,
      );

      return solicitud;
    });

    // Eliminar las notificaciones del contratista (fuera de la tx, no bloquea si falla)
    await this.notificacionesService
      .eliminarPorAccionCompletada('ARCHIVADO_PENDIENTE', contratistaId)
      .catch((err) =>
        this.logger.warn(
          `[NOTIF] No se pudieron eliminar notificaciones: ${err}`,
        ),
      );

    return resultado;
  }

  async rechazarArchivado(
    contratistaId: number,
    usuarioId: number,
    motivo: string,
  ): Promise<HseSolicitudArchivado> {
    const solicitud = await this.solicitudRepo.findOne({
      where: { contratistaId, estado: SolicitudArchivadoEstado.PENDIENTE },
    });

    if (!solicitud) {
      throw new NotFoundException(
        `No existe solicitud de archivado pendiente para el contratista ${contratistaId}`,
      );
    }

    solicitud.estado = SolicitudArchivadoEstado.RECHAZADO;
    solicitud.motivo = motivo;
    solicitud.resolvidoPor = usuarioId;
    solicitud.fechaResolucion = new Date();

    const saved = await this.solicitudRepo.save(solicitud);

    this.logger.log(
      `[AUDIT] Archivado rechazado — contratistaId=${contratistaId} resolvidoPor=${usuarioId} motivo="${motivo}"`,
    );

    // Eliminar las notificaciones del contratista (no bloquea si falla)
    await this.notificacionesService
      .eliminarPorAccionCompletada('ARCHIVADO_PENDIENTE', contratistaId)
      .catch((err) =>
        this.logger.warn(
          `[NOTIF] No se pudieron eliminar notificaciones: ${err}`,
        ),
      );

    return saved;
  }
}
