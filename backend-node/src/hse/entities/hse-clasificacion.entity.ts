import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { HseContratista } from './hse-contratista.entity';
import { RiesgoClasificacion, ModalidadTrabajo } from '../../common/enums/hse.enum';

@Entity('hse_clasificacion')
export class HseClasificacion extends BaseEntity {
  @Column({ name: 'contratista_id', type: 'int', unique: true })
  contratistaId: number;

  @Column({ type: 'enum', enum: RiesgoClasificacion, nullable: false })
  riesgo: RiesgoClasificacion;

  @Column({ name: 'modalidad_trabajo', type: 'enum', enum: ModalidadTrabajo, nullable: false })
  modalidadTrabajo: ModalidadTrabajo;

  @Column({ name: 'cargo_actividad', type: 'varchar', length: 250, nullable: false })
  cargoActividad: string;

  @Column({ name: 'requiere_trabajo_altura', type: 'boolean', default: false })
  requiereTrabajoAltura: boolean;

  @Column({ name: 'requiere_espacios_confinados', type: 'boolean', default: false })
  requiereEspaciosConfinados: boolean;

  @Column({ name: 'requiere_energias_peligrosas', type: 'boolean', default: false })
  requiereEnergiasPeligrosas: boolean;

  @Column({ name: 'requiere_caliente', type: 'boolean', default: false })
  requiereCaliente: boolean;

  @Column({ name: 'requiere_quimicos', type: 'boolean', default: false })
  requiereQuimicos: boolean;

  @OneToOne(() => HseContratista, (contratista) => contratista.clasificacion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contratista_id' })
  contratista: HseContratista;
}
