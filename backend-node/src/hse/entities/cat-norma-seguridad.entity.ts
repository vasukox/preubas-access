import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Sede } from '../../sede/entities/sede.entity';

@Entity('cat_normas_seguridad')
export class CatNormaSeguridad extends BaseEntity {
  @Column({ type: 'int', nullable: false, comment: 'Orden de lectura' })
  numero: number;

  @Column({ type: 'varchar', length: 200, nullable: false })
  titulo: string;

  @Column({ type: 'text', nullable: false })
  contenido: string;

  @Column({ type: 'boolean', default: true, nullable: false })
  activa: boolean;

  @Column({
    name: 'sede_id',
    type: 'int',
    nullable: true,
    comment: 'NULL = aplica a todas las sedes',
  })
  sedeId: number;

  @ManyToOne(() => Sede, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'sede_id' })
  sede: Sede;
}
