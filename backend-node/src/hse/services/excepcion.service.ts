import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { HseExcepcion } from '../entities/hse-excepcion.entity';
import { CreateExcepcionDto, CreateExcepcionLoteDto } from '../dto/excepcion.dto';
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
    const sedeId = dto.sedeId;
    const fechaInicio = dto.fechaInicio;
    const fechaFin = dto.fechaFin;
    const personaId = dto.personaId ?? null;

    this.validarBase(sedeId, fechaInicio, fechaFin, dto.motivo);

    const persona = personaId
      ? await this.personaRepo.findOne({ where: { id: personaId }, relations: ['proveedor'] })
      : await this.buscarOCrearPersonaDesdeDocumento(dto);

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
      fechaInicio: fechaInicio as any,
      fechaFin: fechaFin as any,
      activa: true,
    });
    return this.excepcionRepo.save(excepcion);
  }

  async crearExcepcionLote(aprobadoPor: number, dto: CreateExcepcionLoteDto) {
    const sedeId = dto.sedeId;
    const fechaInicio = dto.fechaInicio;
    const fechaFin = dto.fechaFin;
    this.validarBase(sedeId, fechaInicio, fechaFin, dto.motivo);

    const excepciones: HseExcepcion[] = [];

    for (const personaId of dto.personasIds ?? []) {
      const persona = await this.personaRepo.findOne({ where: { id: personaId } });
      if (!persona) throw new NotFoundException(`Persona ${personaId} no encontrada`);
      excepciones.push(this.excepcionRepo.create({
        aprobadoPor,
        personaId,
        tipoDocumento: persona.tipoDocumento,
        numeroDocumento: persona.numeroDocumento,
        nombreCompleto: this.nombrePersona(persona),
        proveedorId: dto.proveedorId ?? persona.proveedorId ?? null,
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
        tipoDocumento: contratista.tipoDocumento,
        numeroDocumento: contratista.numeroDocumento,
        nombreCompleto: contratista.nombreCompleto,
        proveedorId: dto.proveedorId,
      });

      excepciones.push(this.excepcionRepo.create({
        aprobadoPor,
        personaId: persona?.id ?? null,
        tipoDocumento: contratista.tipoDocumento ?? persona?.tipoDocumento ?? 'CC',
        numeroDocumento: contratista.numeroDocumento,
        nombreCompleto: contratista.nombreCompleto,
        proveedorId: dto.proveedorId ?? persona?.proveedorId ?? null,
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
    const hoy = new Date();
    return this.excepcionRepo.find({
      where: {
        personaId,
        activa: true,
        fechaInicio: LessThanOrEqual(hoy),
        fechaFin: MoreThanOrEqual(hoy),
      },
      relations: ['aprobador', 'sede'],
    });
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
    const hoy = new Date();
    if (new Date(excepcion.fechaFin) < hoy) {
      throw new BadRequestException('No se puede activar una excepcion vencida');
    }
    excepcion.activa = true;
    return this.excepcionRepo.save(excepcion);
  }

  async actualizarExcepcion(id: number, dto: Partial<CreateExcepcionDto>) {
    const excepcion = await this.excepcionRepo.findOne({ where: { id } });
    if (!excepcion) throw new BadRequestException('Excepcion no encontrada');

    const fechaInicio = dto.fechaInicio ?? String(excepcion.fechaInicio);
    const fechaFin = dto.fechaFin ?? String(excepcion.fechaFin);
    this.validarBase(dto.sedeId ?? excepcion.sedeId, fechaInicio, fechaFin, dto.motivo ?? excepcion.motivo);

    if (dto.sedeId) excepcion.sedeId = dto.sedeId;
    if (dto.motivo !== undefined) excepcion.motivo = dto.motivo.trim();
    if (dto.fechaInicio) excepcion.fechaInicio = fechaInicio as any;
    if (dto.fechaFin) excepcion.fechaFin = fechaFin as any;
    if (dto.tipoDocumento !== undefined) excepcion.tipoDocumento = dto.tipoDocumento;
    if (dto.numeroDocumento !== undefined) excepcion.numeroDocumento = dto.numeroDocumento;
    if (dto.nombreCompleto !== undefined) excepcion.nombreCompleto = dto.nombreCompleto;
    if (dto.proveedorId !== undefined) excepcion.proveedorId = dto.proveedorId;
    if (dto.ubicacionId !== undefined) excepcion.ubicacionId = dto.ubicacionId;

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
}
