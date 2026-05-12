import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HseContratista } from '../entities/hse-contratista.entity';
import { HseClasificacion } from '../entities/hse-clasificacion.entity';
import { HseSegSocial } from '../entities/hse-seg-social.entity';
import { HseCertificaciones } from '../entities/hse-certificaciones.entity';
import { HseExamenMedico } from '../entities/hse-examen-medico.entity';
import { HseContactoEmergencia } from '../entities/hse-contacto-emergencia.entity';
import { HseAceptacionNormas } from '../entities/hse-aceptacion-normas.entity';
import { HseAutorizacion } from '../entities/hse-autorizacion.entity';
import { HseHistorial } from '../entities/hse-historial.entity';
import { EstadoAutorizacion, EstadoContratista } from '../../common/enums/hse.enum';
import {
  ClasificacionDto,
  SegSocialItemDto,
  CertificacionesDto,
  ExamenMedicoDto,
  ContactoEmergenciaDto,
  AceptacionNormasDto,
} from '../dto/autogestion.dto';

@Injectable()
export class AutogestionService {
  constructor(
    @InjectRepository(HseContratista)
    private readonly contratistaRepo: Repository<HseContratista>,
    @InjectRepository(HseClasificacion)
    private readonly clasificacionRepo: Repository<HseClasificacion>,
    @InjectRepository(HseSegSocial)
    private readonly segSocialRepo: Repository<HseSegSocial>,
    @InjectRepository(HseCertificaciones)
    private readonly certificacionesRepo: Repository<HseCertificaciones>,
    @InjectRepository(HseExamenMedico)
    private readonly examenMedicoRepo: Repository<HseExamenMedico>,
    @InjectRepository(HseContactoEmergencia)
    private readonly contactoEmergenciaRepo: Repository<HseContactoEmergencia>,
    @InjectRepository(HseAceptacionNormas)
    private readonly aceptacionNormasRepo: Repository<HseAceptacionNormas>,
    @InjectRepository(HseAutorizacion)
    private readonly autorizacionRepo: Repository<HseAutorizacion>,
    @InjectRepository(HseHistorial)
    private readonly historialRepo: Repository<HseHistorial>,
  ) {}

  async getDatosIniciales(contratista: HseContratista) {
    const c = await this.contratistaRepo.findOne({
      where: { id: contratista.id },
      relations: [
        'autorizacion',
        'autorizacion.sede',
        'autorizacion.proveedor',
        'clasificacion',
        'seguridadSocial',
        'certificaciones',
        'examenMedico',
        'contactoEmergencia',
        'aceptacionNormas',
      ],
    });

    if (!c) throw new NotFoundException('Contratista no encontrado');

    // Al abrir el link de autogestión, marcar inmediatamente el avance.
    await this.marcarEnProgreso(c);

    const a = c.autorizacion;

    return {
      contratista_id:        c.id,
      autorizacion_id:       a?.id ?? null,
      tipo_documento:        c.tipoDocumento,
      numero_documento:      c.numeroDocumento,
      nombres:               c.nombres,
      apellidos:             c.apellidos,
      email:                 c.email,
      telefono:              c.telefono ?? null,
      es_extranjero:         c.esExtranjero,
      estado:                c.estado,
      sede_id:               a?.sedeId ?? null,
      sede_nombre:           a?.sede?.nombre ?? '',
      tipo_contratista:      a?.tipoContratista ?? null,
      empresa_proveedor:     a?.proveedor?.nomProveedor ?? null,
      descripcion_actividad: a?.descripcionActividad ?? '',
      fecha_inicio:          a?.fechaInicio ?? null,
      fecha_fin:             a?.fechaFin ?? null,
      clasificacion:         c.clasificacion ?? null,
      seguridad_social:      c.seguridadSocial ?? [],
      certificaciones:       c.certificaciones ?? null,
      examen_medico:         c.examenMedico ?? null,
      contacto_emergencia:   c.contactoEmergencia ?? null,
      aceptacion_normas:     c.aceptacionNormas ?? null,
    };
  }

  async guardarDatosPersonales(contratistaId: number, dto: any) {
    const contratista = await this.contratistaRepo.findOne({ where: { id: contratistaId } });
    if (!contratista) throw new NotFoundException('Contratista no encontrado');

    if (dto.nombres)               contratista.nombres = dto.nombres;
    if (dto.apellidos)             contratista.apellidos = dto.apellidos;
    if (dto.email)                 contratista.email = dto.email;
    if (dto.telefono !== undefined) contratista.telefono = dto.telefono;
    if (dto.esExtranjero !== undefined) contratista.esExtranjero = dto.esExtranjero;
    if (dto.sstResponsableNombre)   contratista.sstResponsableNombre = dto.sstResponsableNombre;
    if (dto.sstResponsableTelefono) contratista.sstResponsableTelefono = dto.sstResponsableTelefono;

    await this.marcarEnProgreso(contratista);
    await this.contratistaRepo.save(contratista);
    return { success: true };
  }

  async guardarClasificacion(contratistaId: number, dto: ClasificacionDto) {
    await this.marcarContratistaEnProgreso(contratistaId);
    const n = (v: any) => v ?? null;
    const data = {
      contratistaId,
      trabajoAlturas:           dto.trabajoAlturas ?? false,
      espaciosConfinados:       dto.espaciosConfinados ?? false,
      trabajoElectrico:         dto.trabajoElectrico ?? false,
      trabajoCaliente:          dto.trabajoCaliente ?? false,
      izajeMaquinaria:          dto.izajeMaquinaria ?? false,
      visitaSinRiesgo:          dto.visitaSinRiesgo ?? false,
      personalExtranjero:       dto.personalExtranjero ?? false,
      generaResiduos:           dto.generaResiduos ?? false,

      alturasNivel:             n(dto.alturasNivel),
      alturasCertFechaVenc:     n(dto.alturasCertFechaVenc),
      alturasCertArchivo:       n(dto.alturasCertArchivo),

      confinadosRol:            n(dto.confinadosRol),
      confinadosCertFecha:      n(dto.confinadosCertFecha),
      confinadosCertArchivo:    n(dto.confinadosCertArchivo),

      electricoMatriculaContec: n(dto.electricoMatriculaContec),
      electricoNumMatricula:    n(dto.electricoNumMatricula),
      electricoMatriculaVenc:   n(dto.electricoMatriculaVenc),
      electricoMatriculaArchivo:n(dto.electricoMatriculaArchivo),

      calienteExtintorFecha:    n(dto.calienteExtintorFecha),
      calienteExtintorArchivo:  n(dto.calienteExtintorArchivo),
      calientePermisoFecha:     n(dto.calientePermisoFecha),
      calientePermisoArchivo:   n(dto.calientePermisoArchivo),

      izajeTipoEquipo:          n(dto.izajeTipoEquipo),
      izajeInspeccionArchivo:   n(dto.izajeInspeccionArchivo),
      izajeDocLegalArchivo:     n(dto.izajeDocLegalArchivo),
      izajeLicenciaArchivo:     n(dto.izajeLicenciaArchivo),

      extranAseguradora:        n(dto.extranAseguradora),
      extranNumPoliza:          n(dto.extranNumPoliza),
      extranPolizaVenc:         n(dto.extranPolizaVenc),
      extranPolizaArchivo:      n(dto.extranPolizaArchivo),

      residuosTipo:             n(dto.residuosTipo),
      residuosPlanArchivo:      n(dto.residuosPlanArchivo),
    };

    const existing = await this.clasificacionRepo.findOne({ where: { contratistaId } });
    if (existing) {
      await this.clasificacionRepo.update(existing.id, data as any);
    } else {
      await this.clasificacionRepo.insert(data as any);
    }

    return this.clasificacionRepo.findOne({ where: { contratistaId } });
  }

  async guardarSeguridadSocial(contratistaId: number, dto: SegSocialItemDto[]) {
    await this.marcarContratistaEnProgreso(contratistaId);
    const existentes = await this.segSocialRepo.find({ where: { contratistaId } });
    if (existentes.length > 0) {
      await this.segSocialRepo.remove(existentes);
    }

    if (Array.isArray(dto) && dto.length > 0) {
      const afiliaciones = dto.map(a =>
        this.segSocialRepo.create({
          contratistaId,
          esTitular:            a.esTitular ?? true,
          nombrePersona:        a.nombrePersona,
          cedulaPersona:        a.cedulaPersona,
          epsId:                a.epsId,
          epsVigencia:          a.epsVigencia as any,
          arlId:                a.arlId,
          arlVigencia:          a.arlVigencia as any,
          afpId:                a.afpId,
          afpVigencia:          a.afpVigencia as any,
          pilaTipo:             a.pilaTipo,
          pilaEstado:           a.pilaEstado,
          pilaArchivo:          a.pilaArchivo,
          sstTieneVigente:      a.sstTieneVigente ?? false,
          sstResponsableNombre: a.sstResponsableNombre,
          sstResolucionRegistro:a.sstResolucionRegistro,
        }),
      );
      return this.segSocialRepo.save(afiliaciones);
    }
    return [];
  }

  async guardarCertificaciones(contratistaId: number, dto: CertificacionesDto) {
    await this.marcarContratistaEnProgreso(contratistaId);
    const n = (v: any) => v ?? null;
    const data = {
      contratistaId,
      artDescripcionTarea: n(dto.artDescripcionTarea),
      artArchivo:          n(dto.artArchivo),
      permisoTipo:         n(dto.permisoTipo),
      permisoFecha:        n(dto.permisoFecha),
      permisoArchivo:      n(dto.permisoArchivo),
    };
    const existing = await this.certificacionesRepo.findOne({ where: { contratistaId } });
    if (existing) {
      await this.certificacionesRepo.update(existing.id, data as any);
    } else {
      await this.certificacionesRepo.insert(data as any);
    }
    return this.certificacionesRepo.findOne({ where: { contratistaId } });
  }

  async guardarExamenMedico(contratistaId: number, dto: ExamenMedicoDto) {
    await this.marcarContratistaEnProgreso(contratistaId);
    const n = (v: any) => v ?? null;
    const data = {
      contratistaId,
      fechaExamen:            n(dto.fechaExamen),
      concepto:               n(dto.concepto),
      descripcionRestriccion: n(dto.descripcionRestriccion),
      archivo:                n(dto.archivo),
    };
    const existing = await this.examenMedicoRepo.findOne({ where: { contratistaId } });
    if (existing) {
      await this.examenMedicoRepo.update(existing.id, data as any);
    } else {
      await this.examenMedicoRepo.insert(data as any);
    }
    return this.examenMedicoRepo.findOne({ where: { contratistaId } });
  }

  async guardarContactoEmergencia(contratistaId: number, dto: ContactoEmergenciaDto) {
    await this.marcarContratistaEnProgreso(contratistaId);
    const n = (v: any) => v ?? null;
    const data = {
      contratistaId,
      nombreCompleto:  dto.nombreCompleto,
      relacion:        dto.relacion,
      relacionOtro:    n(dto.relacionOtro),
      telefonoCelular: dto.telefonoCelular,
      telefonoFijo:    n(dto.telefonoFijo),
      rhSanguineo:     n(dto.rhSanguineo),
      alergias:        n(dto.alergias),
      condicionMedica: n(dto.condicionMedica),
      epsContratista:  n(dto.epsContratista),
    };
    const existing = await this.contactoEmergenciaRepo.findOne({ where: { contratistaId } });
    if (existing) {
      await this.contactoEmergenciaRepo.update(existing.id, data as any);
    } else {
      await this.contactoEmergenciaRepo.insert(data as any);
    }
    return this.contactoEmergenciaRepo.findOne({ where: { contratistaId } });
  }

  async guardarAceptacionNormas(contratistaId: number, dto: AceptacionNormasDto) {
    await this.marcarContratistaEnProgreso(contratistaId);
    const n = (v: any) => v ?? null;
    const data = {
      contratistaId,
      aceptoNormas:    dto.aceptoNormas,
      aceptoDatos:     dto.aceptoDatos,
      firmaDigital:    dto.firmaDigital,
      ipAddress:       n(dto.ipAddress),
      fechaAceptacion: new Date(),
    };
    const existing = await this.aceptacionNormasRepo.findOne({ where: { contratistaId } });
    if (existing) {
      await this.aceptacionNormasRepo.update(existing.id, data as any);
    } else {
      await this.aceptacionNormasRepo.insert(data as any);
    }
    return this.aceptacionNormasRepo.findOne({ where: { contratistaId } });
  }

  async finalizarAutogestion(contratistaId: number) {
    const contratista = await this.contratistaRepo.findOne({ where: { id: contratistaId } });
    if (!contratista) {
      throw new BadRequestException('Contratista no encontrado');
    }

    const estadoAnterior = contratista.estado;
    contratista.estado = EstadoContratista.AUTOGESTION_COMPLETADA;
    contratista.autogestionCompletadaEn = new Date();

    await this.contratistaRepo.save(contratista);
    await this.registrarHistorial(
      contratista.id,
      estadoAnterior,
      EstadoContratista.AUTOGESTION_COMPLETADA,
      'Autogestion finalizada',
    );
    await this.sincronizarAutorizacion(contratista.autorizacionId, EstadoAutorizacion.EN_REVISION);

    return { success: true, message: 'Autogestion completada con exito' };
  }

  private async marcarContratistaEnProgreso(contratistaId: number) {
    const contratista = await this.contratistaRepo.findOne({ where: { id: contratistaId } });
    if (!contratista) throw new NotFoundException('Contratista no encontrado');
    await this.marcarEnProgreso(contratista);
  }

  private async marcarEnProgreso(contratista: HseContratista) {
    if (contratista.estado !== EstadoContratista.PENDIENTE_AUTOGESTION) {
      return;
    }

    const estadoAnterior = contratista.estado;
    contratista.estado = EstadoContratista.AUTOGESTION_EN_PROGRESO;
    await this.contratistaRepo.save(contratista);
    await this.registrarHistorial(
      contratista.id,
      estadoAnterior,
      EstadoContratista.AUTOGESTION_EN_PROGRESO,
      'Autogestion iniciada',
    );
    await this.sincronizarAutorizacion(contratista.autorizacionId, EstadoAutorizacion.PENDIENTE_AUTOGESTION);
  }

  private async sincronizarAutorizacion(autorizacionId: number, estado: EstadoAutorizacion) {
    if (!autorizacionId) return;

    const autorizacion = await this.autorizacionRepo.findOne({ where: { id: autorizacionId } });
    if (
      autorizacion &&
      ![EstadoAutorizacion.APROBADO, EstadoAutorizacion.DENEGADO, EstadoAutorizacion.VENCIDO].includes(autorizacion.estado)
    ) {
      autorizacion.estado = estado;
      await this.autorizacionRepo.save(autorizacion);
    }
  }

  private async registrarHistorial(
    contratistaId: number,
    estadoAnterior: string | null,
    estadoNuevo: string,
    motivo: string,
  ) {
    if (estadoAnterior === estadoNuevo) {
      return;
    }

    await this.historialRepo.save(
      this.historialRepo.create({
        contratistaId,
        estadoAnterior,
        estadoNuevo,
        motivo,
      }),
    );
  }
}
