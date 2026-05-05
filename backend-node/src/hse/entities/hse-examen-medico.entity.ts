import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { HseContratista } from './hse-contratista.entity';

@Entity('hse_examen_medico')
export class HseExamenMedico extends BaseEntity {
  @Column({ name: 'contratista_id', type: 'int', unique: true })
  contratistaId: number;

  @Column({ name: 'url_certificado_aptitud', type: 'text', nullable: false })
  urlCertificadoAptitud: string;

  @Column({ name: 'fecha_emision', type: 'date', nullable: false })
  fechaEmision: Date;

  @Column({ name: 'apto_con_restricciones', type: 'boolean', default: false })
  aptoConRestricciones: boolean;

  @Column({ type: 'text', nullable: true })
  restricciones: string;

  @OneToOne(() => HseContratista, (contratista) => contratista.examenMedico, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contratista_id' })
  contratista: HseContratista;
}
