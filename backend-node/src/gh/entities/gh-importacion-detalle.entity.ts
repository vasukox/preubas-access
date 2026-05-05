import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { GhImportacion } from './gh-importacion.entity';

@Entity('gh_importaciones_detalle')
export class GhImportacionDetalle extends BaseEntity {
  @Column({ name: 'importacion_id', type: 'int', nullable: false })
  importacionId: number;

  @Column({ name: 'numero_fila', type: 'int', nullable: false })
  numeroFila: number;

  @Column({ type: 'varchar', length: 20, default: 'ERROR', nullable: false })
  estado: string;

  @Column({ type: 'text', nullable: false })
  mensaje: string;

  @Column({ type: 'json', nullable: true })
  payload: Record<string, any>;

  @ManyToOne(() => GhImportacion, (importacion) => importacion.detalles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'importacion_id' })
  importacion: GhImportacion;
}
