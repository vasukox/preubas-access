import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { Sede } from '../../sede/entities/sede.entity'
import { ParkingCupo } from './parking-cupo.entity'

@Entity('parking_zonas')
export class ParkingZona extends BaseEntity {
  @Column({ name: 'sede_id', type: 'int', nullable: false })
  sedeId: number

  @Column({ type: 'varchar', length: 100, nullable: false })
  nombre: string

  @Column({ type: 'text', nullable: true })
  descripcion: string | null

  @Column({ name: 'capacidad_total', type: 'int', nullable: false, default: 0 })
  capacidadTotal: number

  @Column({ name: 'capacidad_carros', type: 'int', nullable: false, default: 0 })
  capacidadCarros: number

  @Column({ name: 'capacidad_motos', type: 'int', nullable: false, default: 0 })
  capacidadMotos: number

  @Column({ name: 'capacidad_bicis', type: 'int', nullable: false, default: 0 })
  capacidadBicis: number

  @Column({ name: 'capacidad_electricos', type: 'int', nullable: false, default: 0 })
  capacidadElectricos: number

  @Column({ name: 'capacidad_visitantes', type: 'int', nullable: false, default: 0 })
  capacidadVisitantes: number

  @Column({ name: 'capacidad_movilidad_reducida', type: 'int', nullable: false, default: 0 })
  capacidadMovilidadReducida: number

  @Column({ type: 'boolean', nullable: false, default: true })
  activa: boolean

  @ManyToOne(() => Sede, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sede_id' })
  sede: Sede

  @OneToMany(() => ParkingCupo, (c) => c.zona, { cascade: true })
  cupos: ParkingCupo[]
}
