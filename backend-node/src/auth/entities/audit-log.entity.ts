import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

/**
 * Registro inmutable de todas las acciones administrativas del sistema.
 *
 * Equivalente a `class AuditLog(BaseModel)` en Python (app/models/usuario.py).
 * Tabla: audit_log
 * No tiene soft delete — es permanente por diseño.
 */
@Entity('audit_log')
export class AuditLog extends BaseEntity {
  @Column({ name: 'actor_id', type: 'int', nullable: true })
  actorId: number;

  @Column({
    name: 'actor_nombre',
    type: 'varchar',
    length: 150,
    nullable: false,
  })
  actorNombre: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  accion: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  entidad: string;

  @Column({ name: 'entidad_id', type: 'int', nullable: true })
  entidadId: number;

  @Column({ type: 'text', nullable: true })
  descripcion: string;
}
