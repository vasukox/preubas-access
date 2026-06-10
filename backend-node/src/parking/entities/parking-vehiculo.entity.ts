import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { Sede } from '../../sede/entities/sede.entity'
import { Persona } from '../../persona/entities/persona.entity'
import { TipoVehiculo } from '../../common/enums/parking.enum'

@Entity('parking_vehiculos')
export class ParkingVehiculo extends BaseEntity {
  @Column({ name: 'solicitud_id', type: 'int', nullable: true })
  solicitudId: number | null

  @Column({ name: 'sede_id', type: 'int', nullable: false })
  sedeId: number

  @Column({ name: 'persona_id', type: 'int', nullable: true })
  personaId: number | null

  @Column({ type: 'varchar', length: 10, nullable: false })
  placa: string

  @Column({ type: 'varchar', length: 50, nullable: false })
  marca: string

  @Column({ type: 'varchar', length: 50, nullable: false })
  linea: string

  @Column({ type: 'varchar', length: 30, nullable: false })
  color: string

  @Column({ name: 'modelo_anio', type: 'smallint', nullable: true })
  modeloAnio: number | null

  @Column({ name: 'tipo_vehiculo', type: 'enum', enum: TipoVehiculo, nullable: false })
  tipoVehiculo: TipoVehiculo

  @Column({ name: 'es_vehiculo_empresa', type: 'boolean', nullable: false, default: false })
  esVehiculoEmpresa: boolean

  @Column({ name: 'es_electrico', type: 'boolean', nullable: false, default: false })
  esElectrico: boolean

  @Column({ type: 'boolean', nullable: false, default: true })
  activo: boolean

  @ManyToOne(() => Sede, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sede_id' })
  sede: Sede

  @ManyToOne(() => Persona, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'persona_id' })
  persona: Persona | null
}
