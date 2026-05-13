import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HseExcepcion } from '../entities/hse-excepcion.entity';
import { CreateExcepcionDto, CreateExcepcionLoteDto, UpdateExcepcionDto } from '../dto/excepcion.dto';
import { Persona } from '../../persona/entities/persona.entity';

@Injectable()
export class ExcepcionService {
  constructor(
    @InjectRepository(HseExcepcion)
    private readonly excepcionRepo: Repository<HseExcepcion>,
    @InjectRepository(Persona)
    private readonly personaRepo: Repository<Persona>,
  ) {}

  async crearExcepcion(aprobadoPor: number, dto: CreateExcepcionDto) {
    const sedeId = dto.sede_id;
    const fechaInicio = dto.fecha_inicio;
    const fechaFin = dto.fecha_fin;
    const personaId = dto.persona_id ?? null;

    this.validarBase(sedeId, fechaInicio, fechaFin, dto.motivo);

    const persona = personaId
      ? await this.personaRepo.findOne({ where: { id: personaId }, relations: ['proveedor'] })
      : await this.buscarOCrearPersonaDesdeDocumento({
          tipoDocumento: dto.tipo_documento,
          numeroDocumento: dto.numero_documento,
          nombreCompleto: dto.nombre_completo,
          proveedorId: dto.proveedor_id,
        });

    const excepcion = this.excepcionRepo.create({
      aprobadoPor,
      personaId: persona?.id ?? null,
      tipoDocumento: dto.tipo_documento ?? persona?.tipoDocumento ?? null,
      numeroDocumento: dto.numero_documento ?? persona?.numeroDocumento ?? null,
      nombreCompleto: dto.nombre_completo ?? this.nombrePersona(persona),
      proveedorId: dto.proveedor_id ?? persona?.proveedorId ?? null,
      origenExcepcion: 'INDIVIDUAL',
      sedeId,
      motivo: dto.motivo.trim(),
      ubicacionId: dto.ubicacion_id ?? null,
      fechaInicio: fechaInicio as any,
      fechaFin: fechaFin as any,
      activa: true,
    });
    return this.excepcionRepo.save(excepcion);
  }

  async crearExcepcionLote(aprobadoPor: number, dto: CreateExcepcionLoteDto) {
    const sedeId = dto.sede_id;
    const fechaInicio = dto.fecha_inicio;
    const fechaFin = dto.fecha_fin;
    this.validarBase(sedeId, fechaInicio, fechaFin, dto.motivo);

    const excepciones: HseExcepcion[] = [];

    for (const personaId of dto.personas_ids ?? []) {
      const persona = await this.personaRepo.findOne({ where: { id: personaId } });
      if (!persona) throw new NotFoundException(`Persona ${personaId} no encontrada`);
      excepciones.push(this.excepcionRepo.create({
        aprobadoPor,
        personaId,
        tipoDocumento: persona.tipoDocumento,
        numeroDocumento: persona.numeroDocumento,
        nombreCompleto: this.nombrePersona(persona),
        proveedorId: dto.proveedor_id ?? persona.proveedorId ?? null,
        origenExcepcion: 'EMPRESA',
        sedeId,
        motivo: dto.motivo.trim(),
        fechaInicio: fechaInicio as any,
        fechaFin: fechaFin as any,
        activa: true,
      }));
    }

    for (const contratista of dto.contratistas ?? []) {
      const persona = await this.buscarOCrearPersonaDesdeDocumento({
        tipoDocumento: contratista.tipo_documento,
        numeroDocumento: contratista.numero_documento,
        nombreCompleto: contratista.nombre_completo,
        proveedorId: dto.proveedor_id,
      });

      excepciones.push(this.excepcionRepo.create({
        aprobadoPor,
        personaId: persona?.id ?? null,
        tipoDocumento: contratista.tipo_documento ?? persona?.tipoDocumento ?? 'CC',
        numeroDocumento: contratista.numero_documento,
        nombreCompleto: contratista.nombre_completo,
        proveedorId: dto.proveedor_id ?? persona?.proveedorId ?? null,
        origenExcepcion: 'EMPRESA',
        sedeId,
        motivo: dto.motivo.trim(),
        fechaInicio: fechaInicio as any,
        fechaFin: fechaFin as any,
        activa: true,
      }));
    }

    if (excepciones.length === 0) {
      throw new BadRequestException('Debes enviar al menos una persona o contratista');
    }

    return this.excepcionRepo.save(excepciones);
  }

  async getExcepcionesActivas(personaId: number) {
    const hoy = this.fechaHoyLocal();
    return this.excepcionRepo.createQueryBuilder('exc')
      .leftJoinAndSelect('exc.aprobador', 'aprobador')
      .leftJoinAndSelect('exc.sede', 'sede')
      .where('exc.persona_id = :personaId', { personaId })
      .andWhere('exc.activa = :activa', { activa: true })
      .andWhere('DATE(exc.fecha_inicio) <= :hoy', { hoy })
      .andWhere('DATE(exc.fecha_fin) >= :hoy', { hoy })
      .getMany();
  }

  async anularExcepcion(id: number) {
    const excepcion = await this.excepcionRepo.findOne({ where: { id } });
    if (!excepcion) throw new BadRequestException('Excepción no encontrada');
    excepcion.activa = false;
    return this.excepcionRepo.save(excepcion);
  }

  async listarExcepciones(sedeId: number) {
    const excepciones = await this.excepcionRepo.find({
      where: { sedeId },
      relations: ['persona', 'persona.proveedor', 'aprobador'],
      order: { created_at: 'DESC' },
    });

    return excepciones.map(e => ({
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

  async activarExcepcion(id: number) {
    const excepcion = await this.excepcionRepo.findOne({ where: { id } });
    if (!excepcion) throw new BadRequestException('Excepcion no encontrada');
    const hoy = this.fechaHoyLocal();
    const fechaFinStr = String(excepcion.fechaFin).slice(0, 10);
    if (fechaFinStr < hoy) {
      throw new BadRequestException('No se puede activar una excepcion vencida');
    }
    excepcion.activa = true;
    return this.excepcionRepo.save(excepcion);
  }

  async deleteExcepcion(id: number): Promise<{ success: boolean; message: string }> {
    const excepcion = await this.excepcionRepo.findOne({ where: { id } });
    if (!excepcion) throw new BadRequestException('Excepción no encontrada');
    await this.excepcionRepo.softRemove(excepcion);
    return { success: true, message: 'Excepción eliminada correctamente' };
  }

  async actualizarExcepcion(id: number, dto: UpdateExcepcionDto) {
    const excepcion = await this.excepcionRepo.findOne({ where: { id } });
    if (!excepcion) throw new BadRequestException('Excepcion no encontrada');

    const fechaInicio = dto.fecha_inicio ?? String(excepcion.fechaInicio);
    const fechaFin = dto.fecha_fin ?? String(excepcion.fechaFin);
    this.validarBase(dto.sede_id ?? excepcion.sedeId, fechaInicio, fechaFin, dto.motivo ?? excepcion.motivo);

    if (dto.sede_id) excepcion.sedeId = dto.sede_id;
    if (dto.motivo !== undefined) excepcion.motivo = dto.motivo.trim();
    if (dto.fecha_inicio) excepcion.fechaInicio = fechaInicio as any;
    if (dto.fecha_fin) excepcion.fechaFin = fechaFin as any;
    if (dto.tipo_documento !== undefined) excepcion.tipoDocumento = dto.tipo_documento;
    if (dto.numero_documento !== undefined) excepcion.numeroDocumento = dto.numero_documento;
    if (dto.nombre_completo !== undefined) excepcion.nombreCompleto = dto.nombre_completo;
    if (dto.proveedor_id !== undefined) excepcion.proveedorId = dto.proveedor_id;
    if (dto.ubicacion_id !== undefined) excepcion.ubicacionId = dto.ubicacion_id;

    return this.excepcionRepo.save(excepcion);
  }

  private validarBase(
    sedeId: number | undefined,
    fechaInicio: string | undefined,
    fechaFin: string | undefined,
    motivo: string | undefined,
  ) {
    if (!sedeId) throw new BadRequestException('La sede es obligatoria');
    if (!motivo?.trim()) throw new BadRequestException('El motivo es obligatorio');
    if (!fechaInicio || !fechaFin) throw new BadRequestException('Las fechas son obligatorias');
    if (new Date(fechaFin) < new Date(fechaInicio)) {
      throw new BadRequestException('La fecha fin no puede ser menor a la fecha inicio');
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

    const partes = (dto.nombreCompleto ?? 'Excepcion HSE').trim().split(/\s+/);
    const nombres = partes.slice(0, Math.max(1, partes.length - 1)).join(' ');
    const apellidos = partes.length > 1 ? partes.slice(-1).join(' ') : 'HSE';

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
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
  }
}
