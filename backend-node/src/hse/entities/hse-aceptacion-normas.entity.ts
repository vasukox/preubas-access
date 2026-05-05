import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { HseContratista } from './hse-contratista.entity';

@Entity('hse_aceptacion_normas')
export class HseAceptacionNormas extends BaseEntity {
  @Column({ name: 'contratista_id', type: 'int', unique: true })
  contratistaId: number;

  @Column({ name: 'acepta_politicas_sst', type: 'boolean', default: false })
  aceptaPoliticasSst: boolean;

  @Column({ name: 'acepta_tratamiento_datos', type: 'boolean', default: false })
  aceptaTratamientoDatos: boolean;

  @Column({ name: 'fecha_aceptacion', type: 'datetime', nullable: true })
  fechaAceptacion: Date;

  @Column({ name: 'ip_aceptacion', type: 'varchar', length: 45, nullable: true })
  ipAceptacion: string;

  @Column({ name: 'firma_digital_hash', type: 'varchar', length: 255, nullable: true })
  firmaDigitalHash: string;

  @OneToOne(() => HseContratista, (contratista) => contratista.aceptacionNormas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contratista_id' })
  contratista: HseContratista;
}
