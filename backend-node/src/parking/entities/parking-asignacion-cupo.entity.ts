import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { ParkingCupo } from './parking-cupo.entity'
import { ParkingAutorizacion } from './parking-autorizacion.entity'

@Entity('parking_asignaciones_cupo')
export class ParkingAsignacionCupo extends BaseEntity {
  @Column({ name: 'cupo_id', type: 'int', nullable: false })
  cupoId: number

  @Column({ name: 'autorizacion_id', type: 'int', nullable: false })
  autorizacionId: number

  @Column({ name: 'fecha_inicio', type: 'date', nullable: false })
  fechaInicio: Date

  @Column({ name: 'fecha_fin', type: 'date', nullable: false })
  fechaFin: Date

  @Column({ type: 'boolean', nullable: false, default: true })
  activa: boolean

  @ManyToOne(() => ParkingCupo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cupo_id' })
  cupo: ParkingCupo

  @ManyToOne(() => ParkingAutorizacion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'autorizacion_id' })
  autorizacion: ParkingAutorizacion
}
