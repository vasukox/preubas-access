import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { HseContratista } from './hse-contratista.entity';
import { RelacionEmergencia, RhSanguineo } from '../../common/enums/hse.enum';

@Entity('hse_contacto_emergencia')
export class HseContactoEmergencia extends BaseEntity {
  @Column({
    name: 'contratista_id',
    type: 'int',
    unique: true,
    nullable: false,
  })
  contratistaId: number;

  @Column({
    name: 'nombre_completo',
    type: 'varchar',
    length: 150,
    nullable: false,
  })
  nombreCompleto: string;

  @Column({ type: 'enum', enum: RelacionEmergencia, nullable: false })
  relacion: RelacionEmergencia;

  @Column({
    name: 'relacion_otro',
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  relacionOtro: string;

  @Column({
    name: 'telefono_celular',
    type: 'varchar',
    length: 20,
    nullable: false,
  })
  telefonoCelular: string;

  @Column({
    name: 'telefono_fijo',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  telefonoFijo: string;

  @Column({
    name: 'rh_sanguineo',
    type: 'enum',
    enum: RhSanguineo,
    nullable: true,
  })
  rhSanguineo: RhSanguineo;

  @Column({ type: 'text', nullable: true })
  alergias: string;

  @Column({ name: 'condicion_medica', type: 'text', nullable: true })
  condicionMedica: string;

  @Column({
    name: 'eps_contratista',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  epsContratista: string;

  @OneToOne(
    () => HseContratista,
    (contratista) => contratista.contactoEmergencia,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'contratista_id' })
  contratista: HseContratista;
}
