import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { HseContratista } from './hse-contratista.entity';
import { ConceptoMedico } from '../../common/enums/hse.enum';

@Entity('hse_examen_medico')
export class HseExamenMedico extends BaseEntity {
  @Column({ name: 'contratista_id', type: 'int', unique: true })
  contratistaId: number;

  @Column({ name: 'fecha_examen', type: 'date', nullable: true })
  fechaExamen: Date;

  @Column({ type: 'enum', enum: ConceptoMedico, nullable: true })
  concepto: ConceptoMedico;

  @Column({ name: 'descripcion_restriccion', type: 'text', nullable: true })
  descripcionRestriccion: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  archivo: string;

  @OneToOne(() => HseContratista, (contratista) => contratista.examenMedico, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'contratista_id' })
  contratista: HseContratista;
}
