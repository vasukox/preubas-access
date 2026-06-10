import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { Sede } from '../../sede/entities/sede.entity'
import { ParkingZona } from './parking-zona.entity'
import { EstadoCupo, TipoCupo } from '../../common/enums/parking.enum'

@Entity('parking_cupos')
export class ParkingCupo extends BaseEntity {
  @Column({ name: 'zona_id', type: 'int', nullable: false })
  zonaId: number

  @Column({ name: 'sede_id', type: 'int', nullable: false })
  sedeId: number

  @Column({ name: 'numero_cupo', type: 'varchar', length: 20, nullable: false })
  numeroCupo: string

  @Column({ name: 'tipo_cupo', type: 'enum', enum: TipoCupo, nullable: false })
  tipoCupo: TipoCupo

  @Column({ type: 'enum', enum: EstadoCupo, nullable: false, default: EstadoCupo.DISPONIBLE })
  estado: EstadoCupo

  @Column({ type: 'text', nullable: true })
  observacion: string | null

  @ManyToOne(() => ParkingZona, (z) => z.cupos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'zona_id' })
  zona: ParkingZona

  @ManyToOne(() => Sede, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sede_id' })
  sede: Sede
}
