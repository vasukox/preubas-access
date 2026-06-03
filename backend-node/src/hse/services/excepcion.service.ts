import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HseExcepcion } from '../entities/hse-excepcion.entity';
import {
  CreateExcepcionDto,
  CreateExcepcionLoteDto,
  UpdateExcepcionDto,
} from '../dto/excepcion.dto';
import { Persona } from '../../persona/entities/persona.entity';

@Injectable()
export class ExcepcionService {
  private readonly logger = new Logger(ExcepcionService.name);

  constructor(
    @InjectRepository(HseExcepcion)
    private readonly excepcionRepo: Repository<HseExcepcion>,
    @InjectRepository(Persona)
    private readonly personaRepo: Repository<Persona>,
  ) {}

  async crearExcepcion(aprobadoPor: number, dto: CreateExcepcionDto) {
    const sedeId = dto.sedeId;
    const fechaInicio = dto.fechaInicio;
    const fechaFin = dto.fechaFin;
    const personaId = dto.personaId ?? null;

    this.validarBase(sedeId, fechaInicio, fechaFin, dto.motivo);

    const persona = personaId
      ? await this.personaRepo.findOne({
          where: { id: personaId },
          relations: ['proveedor'],
        })
      : await this.buscarOCrearPersonaDesdeDocumento({
          tipoDocumento: dto.tipoDocumento,
          numeroDocumento: dto.numeroDocumento,
          nombreCompleto: dto.nombreCompleto,
          proveedorId: dto.proveedorId,
        });

    const excepcion = this.excepcionRepo.create({
      aprobadoPor,
      personaId: persona?.id ?? null,
      tipoDocumento: dto.tipoDocumento ?? persona?.tipoDocumento ?? null,
      numeroDocumento: dto.numeroDocumento ?? persona?.numeroDocumento ?? null,
      nombreCompleto: dto.nombreCompleto ?? this.nombrePersona(persona),
      proveedorId: dto.proveedorId ?? persona?.proveedorId ?? null,
      origenExcepcion: 'INDIVIDUAL',
      sedeId,
      motivo: dto.motivo.trim(),
      ubicacionId: dto.ubicacionId ?? null,
      fechaInicio: this.toDateOnly(fechaInicio),
      fechaFin: this.toDateOnly(fechaFin),
      activa: true,
    });
    const saved = await this.excepcionRepo.save(excepcion);
    this.logger.log(
      `[AUDIT] Excepción creada — id=${saved.id} sedeId=${sedeId} aprobadoPor=${aprobadoPor} persona="${saved.nombreCompleto}"`,
    );
    return saved;
  }

  async crearExcepcionLote(aprobadoPor: number, dto: CreateExcepcionLoteDto) {
    const sedeId = dto.sedeId;
    const fechaInicio = dto.fechaInicio;
    const fechaFin = dto.fechaFin;
    this.validarBase(sedeId, fechaInicio, fechaFin, dto.motivo);

    const excepciones: HseExcepcion[] = [];

    for (const personaId of dto.personasIds ?? []) {
      const persona = await this.personaRepo.findOne({
        where: { id: personaId },
      });
      if (!persona)
        throw new NotFoundException(`Persona ${personaId} no encontrada`);
      excepciones.push(
        this.excepcionRepo.create({
          aprobadoPor,
          personaId,
          tipoDocumento: persona.tipoDocumento,
          numeroDocumento: persona.numeroDocumento,
          nombreCompleto: this.nombrePersona(persona),
          proveedorId: dto.proveedorId ?? persona.proveedorId ?? null,
          origenExcepcion: 'EMPRESA',
          sedeId,
          motivo: dto.motivo.trim(),
          fechaInicio: this.toDateOnly(fechaInicio),
          fechaFin: this.toDateOnly(fechaFin),
          activa: true,
        }),
      );
    }

    for (const contratista of dto.contratistas ?? []) {
      const persona = await this.buscarOCrearPersonaDesdeDocumento({
        tipoDocumento: contratista.tipoDocumento,
        numeroDocumento: contratista.numeroDocumento,
        nombreCompleto: contratista.nombreCompleto,
        proveedorId: dto.proveedorId,
      });

      excepciones.push(
        this.excepcionRepo.create({
          aprobadoPor,
          personaId: persona?.id ?? null,
          tipoDocumento:
            contratista.tipoDocumento ?? persona?.tipoDocumento ?? 'CC',
          numeroDocumento: contratista.numeroDocumento,
          nombreCompleto: contratista.nombreCompleto,
          proveedorId: dto.proveedorId ?? persona?.proveedorId ?? null,
          origenExcepcion: 'EMPRESA',
          sedeId,
          motivo: dto.motivo.trim(),
          fechaInicio: this.toDateOnly(fechaInicio),
          fechaFin: this.toDateOnly(fechaFin),
          activa: true,
        }),
      );
    }

    if (excepciones.length === 0) {
      throw new BadRequestException(
        'Debes enviar al menos una persona o contratista',
      );
    }

    const saved = await this.excepcionRepo.save(excepciones);
    this.logger.log(
      `[AUDIT] Excepción en lote creada — ${saved.length} excepciones sedeId=${sedeId} aprobadoPor=${aprobadoPor}`,
    );
    return saved;
  }

  async getExcepcionesActivas(personaId: number) {
    const hoy = this.fechaHoyLocal();
    return this.excepcionRepo
      .createQueryBuilder('exc')
      .leftJoinAndSelect('exc.aprobador', 'aprobador')
      .leftJoinAndSelect('exc.sede', 'sede')
      .where('exc.persona_id = :personaId', { personaId })
      .andWhere('exc.activa = :activa', { activa: true })
      .andWhere('DATE(exc.fecha_inicio) <= :hoy', { hoy })
      .andWhere('DATE(exc.fecha_fin) >= :hoy', { hoy })
      .getMany();
  }

  async anularExcepcion(id: number, usuarioId?: number) {
    const excepcion = await this.excepcionRepo.findOne({ where: { id } });
    if (!excepcion) throw new BadRequestException('Excepción no encontrada');
    excepcion.activa = false;
    const saved = await this.excepcionRepo.save(excepcion);
    this.logger.log(
      `[AUDIT] Excepción anulada — id=${id} usuarioId=${usuarioId ?? 'desconocido'}`,
    );
    return saved;
  }

  async listarExcepciones(sedeId: number) {
    const excepciones = await this.excepcionRepo.find({
      where: { sedeId },
      relations: ['persona', 'persona.proveedor', 'aprobador'],
      order: { created_at: 'DESC' },
    });

    return excepciones.map((e) => ({
      ...e,
      tipoDocumento: e.tipoDocumento ?? e.persona?.tipoDocumento,
      numeroDocumento: e.numeroDocumento ?? e.persona?.numeroDocumento,
      nombreCompleto: e.nombreCompleto ?? this.nombrePersona(e.persona),
      proveedorId: e.proveedorId ?? e.persona?.proveedorId,
      proveedorNombre: e.persona?.proveedor?.nomProveedor || null,
    }));
  }

  async obtenerDetalle(id: number) {
    const e = await this.excepcionRepo.findOne({
      where: { id },
      relations: ['persona', 'persona.proveedor', 'aprobador', 'sede'],
    });

    if (!e) throw new BadRequestException('Excepción no encontrada');

    return {
      ...e,
      tipoDocumento: e.tipoDocumento ?? e.persona?.tipoDocumento,
      numeroDocumento: e.numeroDocumento ?? e.persona?.numeroDocumento,
      nombreCompleto: e.nombreCompleto ?? this.nombrePersona(e.persona),
      proveedorId: e.proveedorId ?? e.persona?.proveedorId,
      proveedorNombre: e.persona?.proveedor?.nomProveedor || null,
    };
  }

  async activarExcepcion(id: number, usuarioId?: number) {
    const excepcion = await this.excepcionRepo.findOne({ where: { id } });
    if (!excepcion) throw new BadRequestException('Excepcion no encontrada');
    const hoy = this.fechaHoyLocal();
    const fechaFinStr = this.formatFecha(excepcion.fechaFin).slice(0, 10);
    if (fechaFinStr < hoy) {
      throw new BadRequestException(
        'No se puede activar una excepcion vencida. Primero actualiza la fecha de vigencia.',
      );
    }
    await this.excepcionRepo.update(id, { activa: true });
    this.logger.log(
      `[AUDIT] Excepción activada — id=${id} usuarioId=${usuarioId ?? 'desconocido'}`,
    );
    return this.excepcionRepo.findOne({ where: { id } });
  }

  async deleteExcepcion(
    id: number,
  ): Promise<{ success: boolean; message: string }> {
    const excepcion = await this.excepcionRepo.findOne({ where: { id } });
    if (!excepcion) throw new BadRequestException('Excepción no encontrada');
    await this.excepcionRepo.softRemove(excepcion);
    return { success: true, message: 'Excepción eliminada correctamente' };
  }

  async actualizarExcepcion(id: number, dto: UpdateExcepcionDto) {
    const excepcion = await this.excepcionRepo.findOne({ where: { id } });
    if (!excepcion) throw new BadRequestException('Excepcion no encontrada');

    // Normalizar: tomar solo YYYY-MM-DD (el API devuelve ISO completo "2026-06-03T00:00:00.000Z")
    const fechaInicio = (
      dto.fechaInicio ?? this.formatFecha(excepcion.fechaInicio)
    ).slice(0, 10);
    const fechaFin = (
      dto.fechaFin ?? this.formatFecha(excepcion.fechaFin)
    ).slice(0, 10);
    this.validarBase(
      dto.sedeId ?? excepcion.sedeId,
      fechaInicio,
      fechaFin,
      dto.motivo ?? excepcion.motivo,
    );

    const hoy = this.fechaHoyLocal();

    // Construir el set de campos a actualizar
    const updates: Partial<HseExcepcion> = {};
    if (dto.sedeId !== undefined) updates.sedeId = dto.sedeId;
    if (dto.motivo !== undefined) updates.motivo = dto.motivo.trim();
    if (dto.tipoDocumento !== undefined)
      updates.tipoDocumento = dto.tipoDocumento;
    if (dto.numeroDocumento !== undefined)
      updates.numeroDocumento = dto.numeroDocumento;
    if (dto.nombreCompleto !== undefined)
      updates.nombreCompleto = dto.nombreCompleto;
    if (dto.proveedorId !== undefined) updates.proveedorId = dto.proveedorId;
    if (dto.ubicacionId !== undefined) updates.ubicacionId = dto.ubicacionId;

    // Fechas — siempre actualizamos si vienen en el DTO
    updates.fechaInicio = this.toDateOnly(fechaInicio);
    updates.fechaFin = this.toDateOnly(fechaFin);

    // Auto-reactivar si la nueva fecha fin es hoy o futura
    if (fechaFin >= hoy) {
      updates.activa = true;
    }

    // update() emite un UPDATE SQL directo, evitando problemas de estado de entidad
    await this.excepcionRepo.update(id, updates);

    this.logger.log(
      `[AUDIT] Excepción actualizada — id=${id} fechaFin=${fechaFin} activa=${updates.activa ?? 'sin cambio'}`,
    );

    return this.excepcionRepo.findOne({ where: { id } });
  }

  private validarBase(
    sedeId: number | undefined,
    fechaInicio: string | undefined,
    fechaFin: string | undefined,
    motivo: string | undefined,
  ) {
    if (!sedeId) throw new BadRequestException('La sede es obligatoria');
    if (!motivo?.trim())
      throw new BadRequestException('El motivo es obligatorio');
    if (!fechaInicio || !fechaFin)
      throw new BadRequestException('Las fechas son obligatorias');
    if (new Date(fechaFin) < new Date(fechaInicio)) {
      throw new BadRequestException(
        'La fecha fin no puede ser menor a la fecha inicio',
      );
    }
  }

  private async buscarOCrearPersonaDesdeDocumento(dto: {
    tipoDocumento?: string;
    numeroDocumento?: string;
    nombreCompleto?: string;
    proveedorId?: number;
  }): Promise<Persona | null> {
    if (!dto.numeroDocumento) return null;

    const existente = await this.personaRepo.findOne({
      where: { numeroDocumento: dto.numeroDocumento },
    });
    if (existente) return existente;

    const partes = (dto.nombreCompleto ?? '').trim().split(/\s+/).filter(Boolean);
    const nombres = partes.slice(0, Math.max(1, partes.length - 1)).join(' ') || 'Sin nombre';
    const apellidos = partes.length > 1 ? partes.slice(-1).join(' ') : '';

    const persona: Persona = this.personaRepo.create({
      tipoDocumento: dto.tipoDocumento ?? 'CC',
      numeroDocumento: dto.numeroDocumento,
      nombres,
      apellidos,
      proveedorId: dto.proveedorId ?? null,
      tratamientoDatos: false,
      activo: true,
    });

    return this.personaRepo.save(persona);
  }

  private nombrePersona(persona?: Persona | null) {
    return persona ? `${persona.nombres} ${persona.apellidos}`.trim() : null;
  }

  private fechaHoyLocal(): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota',
    }).format(new Date());
  }

  private toDateOnly(value: string): Date {
    const dateOnly = value.slice(0, 10);
    const [year, month, day] = dateOnly.split('-').map(Number);
    // Usar mediodía UTC (12:00) para evitar que el offset de Colombia (UTC-5)
    // cruce la medianoche y almacene el día anterior en MySQL.
    return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  }

  private formatFecha(fecha: Date | string): string {
    if (fecha instanceof Date) {
      return fecha.toISOString().slice(0, 10);
    }
    return String(fecha).slice(0, 10);
  }
}
