import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { Sede } from '../../sede/entities/sede.entity'
import { Persona } from '../../persona/entities/persona.entity'
import { Usuario } from '../../auth/entities/usuario.entity'
import { ParkingSolicitud } from './parking-solicitud.entity'
import { ParkingVehiculo } from './parking-vehiculo.entity'
import { ParkingCupo } from './parking-cupo.entity'
import { ParkingAcceso } from './parking-acceso.entity'
import {
  EstadoAutorizacionParking,
  TipoAutorizacion,
} from '../../common/enums/parking.enum'

@Entity('parking_autorizaciones')
export class ParkingAutorizacion extends BaseEntity {
  @Column({ name: 'solicitud_id', type: 'int', nullable: false })
  solicitudId: number

  @Column({ name: 'vehiculo_id', type: 'int', nullable: false })
  vehiculoId: number

  @Column({ name: 'persona_id', type: 'int', nullable: true })
  personaId: number | null

  @Column({ name: 'sede_id', type: 'int', nullable: false })
  sedeId: number

  @Column({ name: 'aprobado_por', type: 'int', nullable: false })
  aprobadoPor: number

  @Column({ name: 'tipo_autorizacion', type: 'enum', enum: TipoAutorizacion, nullable: false })
  tipoAutorizacion: TipoAutorizacion

  @Column({ type: 'enum', enum: EstadoAutorizacionParking, nullable: false, default: EstadoAutorizacionParking.ACTIVA })
  estado: EstadoAutorizacionParking

  @Column({ name: 'fecha_inicio', type: 'date', nullable: false })
  fechaInicio: Date

  @Column({ name: 'fecha_fin', type: 'date', nullable: false })
  fechaFin: Date

  @Column({ name: 'dias_permitidos', type: 'text', nullable: true, comment: 'JSON: ["LUNES","MARTES"]' })
  diasPermitidos: string | null

  @Column({ name: 'horario_inicio', type: 'varchar', length: 5, nullable: true })
  horarioInicio: string | null

  @Column({ name: 'horario_fin', type: 'varchar', length: 5, nullable: true })
  horarioFin: string | null

  @Column({ name: 'cupo_id', type: 'int', nullable: true })
  cupoId: number | null

  @Column({ type: 'text', nullable: true })
  observaciones: string | null

  // ── Relaciones ──────────────────────────────────────────────────

  @ManyToOne(() => ParkingSolicitud, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'solicitud_id' })
  solicitud: ParkingSolicitud

  @ManyToOne(() => ParkingVehiculo, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vehiculo_id' })
  vehiculo: ParkingVehiculo

  @ManyToOne(() => Persona, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'persona_id' })
  persona: Persona | null

  @ManyToOne(() => Sede, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sede_id' })
  sede: Sede

  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'aprobado_por' })
  aprobador: Usuario

  @ManyToOne(() => ParkingCupo, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'cupo_id' })
  cupo: ParkingCupo | null

  @OneToMany(() => ParkingAcceso, (a) => a.autorizacion)
  accesos: ParkingAcceso[]
}
