import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacion } from './entities/notificacion.entity';

@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);

  constructor(
    @InjectRepository(Notificacion)
    private readonly notificacionRepo: Repository<Notificacion>,
  ) {}

  async crear(
    usuarioId: number,
    tipo: string,
    titulo: string,
    mensaje: string,
    metadata?: Record<string, any>,
  ): Promise<Notificacion> {
    const notificacion = this.notificacionRepo.create({
      usuarioId,
      tipo,
      titulo,
      mensaje,
      leida: false,
      metadata: metadata ?? null,
    });

    const saved = await this.notificacionRepo.save(notificacion);
    this.logger.log(
      `[NOTIF] Creada notificacion tipo=${tipo} usuarioId=${usuarioId}`,
    );
    return saved;
  }

  async listar(
    usuarioId: number,
    page = 1,
    limit = 20,
  ): Promise<{
    data: Notificacion[];
    total: number;
    page: number;
    pages: number;
  }> {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);
    const skip = (safePage - 1) * safeLimit;

    const [data, total] = await this.notificacionRepo.findAndCount({
      where: { usuarioId, leida: false },
      order: { created_at: 'DESC' },
      skip,
      take: safeLimit,
    });

    return { data, total, page: safePage, pages: Math.ceil(total / safeLimit) };
  }

  async marcarLeida(id: number, usuarioId: number): Promise<Notificacion> {
    const notificacion = await this.notificacionRepo.findOne({
      where: { id, usuarioId },
    });

    if (!notificacion) {
      throw new NotFoundException(`Notificacion ${id} no encontrada`);
    }

    notificacion.leida = true;
    return this.notificacionRepo.save(notificacion);
  }

  async marcarTodasLeidas(
    usuarioId: number,
  ): Promise<{ actualizadas: number }> {
    const result = await this.notificacionRepo
      .createQueryBuilder()
      .update()
      .set({ leida: true })
      .where('usuario_id = :usuarioId', { usuarioId })
      .andWhere('leida = false')
      .execute();

    return { actualizadas: result.affected ?? 0 };
  }

  async conteo(usuarioId: number): Promise<{ conteo: number }> {
    const conteo = await this.notificacionRepo.count({
      where: { usuarioId, leida: false },
    });
    return { conteo };
  }

  /**
   * Elimina todas las notificaciones de un tipo cuyo metadata.contratistaId coincide.
   * Se llama cuando la acción referenciada ya fue completada (aprobar/rechazar archivado).
   */
  async eliminarPorAccionCompletada(
    tipo: string,
    contratistaId: number,
  ): Promise<void> {
    await this.notificacionRepo
      .createQueryBuilder()
      .delete()
      .where('tipo = :tipo', { tipo })
      .andWhere("JSON_EXTRACT(metadata, '$.contratistaId') = :contratistaId", {
        contratistaId,
      })
      .execute();

    this.logger.log(
      `[NOTIF] Eliminadas notificaciones tipo=${tipo} contratistaId=${contratistaId}`,
    );
  }
}
