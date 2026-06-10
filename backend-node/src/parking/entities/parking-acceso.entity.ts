import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { Sede } from '../../sede/entities/sede.entity'
import { Usuario } from '../../auth/entities/usuario.entity'
import { ParkingAutorizacion } from './parking-autorizacion.entity'
import { ParkingCupo } from './parking-cupo.entity'
import {
  TipoVehiculo,
  MetodoAccesoParking,
  ResultadoVerificacion,
} from '../../common/enums/parking.enum'

@Entity('parking_accesos')
export class ParkingAcceso extends BaseEntity {
  @Column({ name: 'sede_id', type: 'int', nullable: false })
  sedeId: number

  @Column({ name: 'registrado_por', type: 'int', nullable: false })
  registradoPor: number

  @Column({ name: 'autorizacion_id', type: 'int', nullable: true })
  autorizacionId: number | null

  @Column({ name: 'excepcion_id', type: 'int', nullable: true })
  excepcionId: number | null

  @Column({ name: 'cupo_id', type: 'int', nullable: true })
  cupoId: number | null

  @Column({ type: 'varchar', length: 10, nullable: false })
  placa: string

  @Column({ name: 'tipo_vehiculo', type: 'enum', enum: TipoVehiculo, nullable: true })
  tipoVehiculo: TipoVehiculo | null

  @Column({ name: 'tipo_acceso', type: 'enum', enum: ['ENTRADA', 'SALIDA'], nullable: false })
  tipoAcceso: 'ENTRADA' | 'SALIDA'

  @Column({ type: 'enum', enum: MetodoAccesoParking, nullable: false, default: MetodoAccesoParking.PLACA_MANUAL })
  metodo: MetodoAccesoParking

  @Column({ type: 'enum', enum: ResultadoVerificacion, nullable: false })
  resultado: ResultadoVerificacion

  @Column({ type: 'text', nullable: true })
  observacion: string | null

  @Column({ name: 'fecha_hora', type: 'datetime', nullable: false })
  fechaHora: Date

  // ── Relaciones ──────────────────────────────────────────────────

  @ManyToOne(() => Sede, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sede_id' })
  sede: Sede

  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'registrado_por' })
  registrador: Usuario

  @ManyToOne(() => ParkingAutorizacion, (a) => a.accesos, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'autorizacion_id' })
  autorizacion: ParkingAutorizacion | null

  @ManyToOne(() => ParkingCupo, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'cupo_id' })
  cupo: ParkingCupo | null
}
