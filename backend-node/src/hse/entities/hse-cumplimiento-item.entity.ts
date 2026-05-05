import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { HseCumplimiento } from './hse-cumplimiento.entity';

@Entity('hse_cumplimientos_items')
export class HseCumplimientoItem extends BaseEntity {
  @Column({ name: 'cumplimiento_id', type: 'int', nullable: false })
  cumplimientoId: number;

  @Column({ name: 'requisito_codigo', type: 'varchar', length: 50, nullable: false })
  requisitoCodigo: string;

  @Column({ name: 'es_cumplido', type: 'boolean', default: false, nullable: false })
  esCumplido: boolean;

  @Column({ type: 'text', nullable: true })
  observacion: string;

  @ManyToOne(() => HseCumplimiento, (cumplimiento) => cumplimiento.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cumplimiento_id' })
  cumplimiento: HseCumplimiento;
}
