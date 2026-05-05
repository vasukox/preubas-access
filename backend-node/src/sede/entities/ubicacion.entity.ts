import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Sede } from './sede.entity';

/**
 * Zona específica dentro de una sede.
 *
 * Equivalente a `class Ubicacion(BaseModel)` en Python (app/models/sede.py).
 * Tabla: ubicaciones
 */
@Entity('ubicaciones')
export class Ubicacion extends BaseEntity {
  @Column({ name: 'sede_id', type: 'int', nullable: false })
  sedeId: number;

  @Column({ type: 'varchar', length: 100, nullable: false })
  nombre: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  codigo: string;

  @Column({ type: 'varchar', length: 50, default: 'GENERAL', nullable: false })
  tipo: string;

  @Column({ type: 'boolean', default: true, nullable: false })
  activa: boolean;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @ManyToOne(() => Sede, (sede) => sede.ubicaciones, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sede_id' })
  sede: Sede;
}