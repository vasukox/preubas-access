import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { HseCumplimiento } from './hse-cumplimiento.entity';

@Entity('hse_cumplimiento_items')
export class HseCumplimientoItem extends BaseEntity {
  @Column({ name: 'cumplimiento_id', type: 'int', nullable: false })
  cumplimientoId: number;

  @Column({ type: 'varchar', length: 300, nullable: false })
  pregunta: string;

  @Column({ type: 'boolean', default: true })
  aplica: boolean;

  @Column({ type: 'boolean', nullable: true })
  cumple: boolean;

  @Column({ type: 'text', nullable: true })
  observacion: string;

  @Column({ type: 'int', nullable: false })
  orden: number;

  @ManyToOne(() => HseCumplimiento, (cumplimiento) => cumplimiento.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cumplimiento_id' })
  cumplimiento: HseCumplimiento;
}
