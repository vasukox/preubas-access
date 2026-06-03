import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { HseContratista } from './hse-contratista.entity';

@Entity('hse_aceptacion_normas')
export class HseAceptacionNormas extends BaseEntity {
  @Column({ name: 'contratista_id', type: 'int', unique: true })
  contratistaId: number;

  @Column({ name: 'acepto_normas', type: 'boolean', default: false })
  aceptoNormas: boolean;

  @Column({ name: 'acepto_datos', type: 'boolean', default: false })
  aceptoDatos: boolean;

  @Column({
    name: 'firma_digital',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  firmaDigital: string;

  @Column({ name: 'fecha_aceptacion', type: 'datetime', nullable: true })
  fechaAceptacion: Date;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  @OneToOne(
    () => HseContratista,
    (contratista) => contratista.aceptacionNormas,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'contratista_id' })
  contratista: HseContratista;
}
