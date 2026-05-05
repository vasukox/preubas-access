import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BaseEntity as TypeOrmBaseEntity,
} from 'typeorm';

/**
 * BaseEntity — clase abstracta que heredan TODAS las entidades del proyecto.
 *
 * Equivalente exacto al modelo base de Python/SQLAlchemy:
 *   id          → Integer, PK, autoincrement
 *   created_at  → DateTime, se llena sola al INSERT
 *   updated_at  → DateTime, se actualiza sola en cada UPDATE
 *   deleted_at  → DateTime, NULL = activo | fecha = eliminado (soft delete)
 *
 * ── Soft deletes automáticos ─────────────────────────────────────────────────
 * Al llamar repo.softDelete(id) o repo.softRemove(entity), TypeORM escribe
 * la fecha en deleted_at en lugar de borrar la fila.
 *
 * Cualquier repo.find() / repo.findOne() posterior agrega automáticamente
 *   WHERE deleted_at IS NULL
 * sin que tengas que escribirlo — idéntico al .where(deleted_at.is_(None))
 * que usabas en SQLAlchemy.
 *
 * Para recuperar registros eliminados usa:
 *   repo.find({ withDeleted: true })
 *
 * Para restaurar un registro eliminado:
 *   repo.restore(id)
 * ─────────────────────────────────────────────────────────────────────────────
 */
export abstract class BaseEntity extends TypeOrmBaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    comment: 'Fecha de creación del registro — se llena automáticamente',
  })
  created_at: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'datetime',
    comment: 'Fecha de última modificación — se actualiza automáticamente',
  })
  updated_at: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'datetime',
    nullable: true,
    comment: 'Soft delete — NULL = activo, fecha = eliminado lógicamente',
  })
  deleted_at: Date | null;
}