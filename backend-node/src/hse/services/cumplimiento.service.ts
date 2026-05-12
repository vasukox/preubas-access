import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HseCumplimiento } from '../entities/hse-cumplimiento.entity';
import { HseCumplimientoItem } from '../entities/hse-cumplimiento-item.entity';
import { CumplimientoEstado } from '../../common/enums/hse.enum';

@Injectable()
export class CumplimientoService {
  constructor(
    @InjectRepository(HseCumplimiento)
    private readonly cumplimientoRepo: Repository<HseCumplimiento>,
    @InjectRepository(HseCumplimientoItem)
    private readonly cumplimientoItemRepo: Repository<HseCumplimientoItem>,
  ) {}

  async getEstadoActual(contratistaId: number) {
    return this.cumplimientoRepo.findOne({
      where: { contratistaId },
      order: { created_at: 'DESC' },
      relations: ['items', 'encargado'],
    });
  }

  async getById(id: number) {
    const cumplimiento = await this.cumplimientoRepo.findOne({
      where: { id },
      relations: ['items', 'encargado', 'contratista', 'contratista.autorizacion'],
    });
    if (!cumplimiento) throw new NotFoundException('Cumplimiento no encontrado');
    return cumplimiento;
  }

  async listarCumplimientos(sedeId: number, estado?: string) {
    const qb = this.cumplimientoRepo.createQueryBuilder('c')
      .leftJoinAndSelect('c.contratista', 'contratista')
      .leftJoinAndSelect('c.encargado', 'encargado')
      .leftJoinAndSelect('contratista.autorizacion', 'autorizacion')
      .leftJoinAndSelect('c.items', 'items')
      .where('c.sedeId = :sedeId', { sedeId });

    if (estado) {
      qb.andWhere('c.estado = :estado', { estado });
    }

    const cumplimientos = await qb.orderBy('c.created_at', 'DESC').getMany();

    return cumplimientos.map(c => {
      const totalItems = c.items ? c.items.length : 0;
      const respondidos = c.items ? c.items.filter(i => i.cumple !== null).length : 0;

      return {
        id: c.id,
        estado: c.estado,
        fechaInicio: c.fechaInicio,
        fechaCierre: c.fechaCierre,
        firmaDigital: c.firmaDigital,
        observacionGeneral: c.observacionGeneral,
        totalItems,
        respondidos,
        sedeId: c.sedeId,
        contratistaId: c.contratistaId,
        contratistaNombre: c.contratista ? `${c.contratista.nombres} ${c.contratista.apellidos}` : 'N/A',
        tipoDocumento: c.contratista ? c.contratista.tipoDocumento : 'N/A',
        numeroDocumento: c.contratista ? c.contratista.numeroDocumento : 'N/A',
        autorizacionCodigo: c.contratista?.autorizacion ? c.contratista.autorizacion.codigo : 'N/A',
        encargadoNombre: c.encargado ? c.encargado.nombreCompleto : 'N/A',
      };
    });
  }

  async iniciarCumplimiento(
    contratistaId: number,
    encargadoId: number,
    sedeId: number,
    itemsPreguntas?: string[]
  ) {
    let cumplimiento = await this.cumplimientoRepo.findOne({
      where: { contratistaId, estado: CumplimientoEstado.EN_PROGRESO },
    });

    if (!cumplimiento) {
      cumplimiento = this.cumplimientoRepo.create({
        contratistaId,
        encargadoId,
        sedeId,
        estado: CumplimientoEstado.EN_PROGRESO,
        fechaInicio: new Date(),
      });
      cumplimiento = await this.cumplimientoRepo.save(cumplimiento);

      // Si no vienen preguntas del frontend, generar defaults según tipo de contratista
      const preguntas = itemsPreguntas && itemsPreguntas.length > 0
        ? itemsPreguntas
        : this.generarPreguntasDefault();

      const cumplimientoId = cumplimiento!.id;
      const items = preguntas.map((pregunta, index) =>
        this.cumplimientoItemRepo.create({
          cumplimientoId,
          pregunta,
          aplica: true,
          orden: index + 1,
        }),
      );
      await this.cumplimientoItemRepo.save(items);
    }

    return this.getEstadoActual(contratistaId);
  }

  /**
   * Genera preguntas por defecto para el checklist de cumplimiento.
   * Alineado con CHECKLIST_NORMAL en hse_service.py de Python.
   */
  private generarPreguntasDefault(): string[] {
    return [
      '¿Se cumplió el objetivo de la visita o auditoría?',
      '¿El visitante respetó las zonas autorizadas?',
      '¿Se firmó el registro de visitas?',
      '¿Se cumplió con las normas de seguridad de la sede?',
    ];
  }

  async actualizarCumplimiento(id: number, dto: any) {
    const cumplimiento = await this.cumplimientoRepo.findOne({ where: { id }, relations: ['items'] });
    if (!cumplimiento) throw new NotFoundException('Cumplimiento no encontrado');

    if (dto.estado) cumplimiento.estado = dto.estado;
    if (dto.observacionGeneral !== undefined) cumplimiento.observacionGeneral = dto.observacionGeneral;
    if (dto.observacion_general !== undefined) cumplimiento.observacionGeneral = dto.observacion_general;
    
    if (dto.estado === CumplimientoEstado.COMPLETADO || dto.estado === CumplimientoEstado.INCUMPLIMIENTO) {
      cumplimiento.fechaCierre = new Date();
    }

    if (dto.items && Array.isArray(dto.items)) {
      for (const itemDto of dto.items) {
        // Soporta tanto camelCase como snake_case desde el frontend
        const itemId = itemDto.item_id || itemDto.itemId;
        const item = cumplimiento.items.find(i => i.id === itemId);
        if (item) {
          if (itemDto.cumple !== undefined) item.cumple = itemDto.cumple;
          if (itemDto.observacion !== undefined) item.observacion = itemDto.observacion;
        }
      }
    }

    return this.cumplimientoRepo.save(cumplimiento);
  }

  async marcarItem(id: number, itemId: number, cumple: boolean, observacion?: string) {
    const item = await this.cumplimientoItemRepo.findOne({ where: { id: itemId, cumplimientoId: id } });
    if (!item) throw new NotFoundException('Item de cumplimiento no encontrado');

    item.cumple = cumple;
    if (observacion !== undefined) item.observacion = observacion;
    return this.cumplimientoItemRepo.save(item);
  }

  async cerrarCumplimiento(id: number, firmaDigital: string, observacionGeneral?: string) {
    const cumplimiento = await this.cumplimientoRepo.findOne({ where: { id }, relations: ['items', 'encargado'] });
    if (!cumplimiento) throw new NotFoundException('Cumplimiento no encontrado');

    // Verificar si cumple o no (si todos los aplicables cumplen)
    const itemsAplicables = cumplimiento.items.filter(i => i.aplica);
    const todosCumplen = itemsAplicables.length > 0 && itemsAplicables.every(i => i.cumple === true);
    
    cumplimiento.estado = todosCumplen ? CumplimientoEstado.COMPLETADO : CumplimientoEstado.INCUMPLIMIENTO;
    cumplimiento.fechaCierre = new Date();
    cumplimiento.firmaDigital = firmaDigital;
    if (observacionGeneral !== undefined) {
      cumplimiento.observacionGeneral = observacionGeneral;
    }

    return this.cumplimientoRepo.save(cumplimiento);
  }
}
