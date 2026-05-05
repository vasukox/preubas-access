import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { HseContratista } from './hse-contratista.entity';
import { Usuario } from '../../auth/entities/usuario.entity';
import { HseCumplimientoItem } from './hse-cumplimiento-item.entity';
import { CumplimientoEstado } from '../../common/enums/hse.enum';

@Entity('hse_cumplimientos')
export class HseCumplimiento extends BaseEntity {
  @Column({ name: 'contratista_id', type: 'int', nullable: false })
  contratistaId: number;

  @Column({ name: 'evaluador_id', type: 'int', nullable: false })
  evaluadorId: number;

  @Column({ type: 'enum', enum: CumplimientoEstado, default: CumplimientoEstado.EN_PROGRESO, nullable: false })
  estado: CumplimientoEstado;

  @Column({ name: 'porcentaje_cumplimiento', type: 'decimal', precision: 5, scale: 2, default: 0 })
  porcentajeCumplimiento: number;

  @Column({ name: 'fecha_evaluacion', type: 'datetime', nullable: true })
  fechaEvaluacion: Date;

  @Column({ name: 'observaciones_generales', type: 'text', nullable: true })
  observacionesGenerales: string;

  @ManyToOne(() => HseContratista, (contratista) => contratista.cumplimientos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contratista_id' })
  contratista: HseContratista;

  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'evaluador_id' })
  evaluador: Usuario;

  @OneToMany(() => HseCumplimientoItem, (item) => item.cumplimiento, { cascade: true })
  items: HseCumplimientoItem[];
}
