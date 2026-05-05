import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { HseContratista } from './hse-contratista.entity';
import { CatEps } from './cat-eps.entity';
import { CatArl } from './cat-arl.entity';
import { CatAfp } from './cat-afp.entity';

@Entity('hse_seg_social')
export class HseSegSocial extends BaseEntity {
  @Column({ name: 'contratista_id', type: 'int' })
  contratistaId: number;

  @Column({ name: 'eps_id', type: 'int', nullable: true })
  epsId: number;

  @Column({ name: 'arl_id', type: 'int', nullable: true })
  arlId: number;

  @Column({ name: 'afp_id', type: 'int', nullable: true })
  afpId: number;

  @Column({ name: 'url_planilla', type: 'text', nullable: false })
  urlPlanilla: string;

  @Column({ name: 'fecha_inicio_cobertura', type: 'date', nullable: false })
  fechaInicioCobertura: Date;

  @Column({ name: 'fecha_fin_cobertura', type: 'date', nullable: false })
  fechaFinCobertura: Date;

  @ManyToOne(() => HseContratista, (contratista) => contratista.seguridadSocial, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contratista_id' })
  contratista: HseContratista;

  @ManyToOne(() => CatEps, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'eps_id' })
  eps: CatEps;

  @ManyToOne(() => CatArl, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'arl_id' })
  arl: CatArl;

  @ManyToOne(() => CatAfp, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'afp_id' })
  afp: CatAfp;
}
