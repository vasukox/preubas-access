import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { Sede } from '../../sede/entities/sede.entity'
import { Persona } from '../../persona/entities/persona.entity'
import { Usuario } from '../../auth/entities/usuario.entity'
import { ParkingAcceso } from './parking-acceso.entity'
import { ParkingAutorizacion } from './parking-autorizacion.entity'
import { TipoNovedad, EstadoNovedad } from '../../common/enums/parking.enum'

@Entity('parking_novedades')
export class ParkingNovedad extends BaseEntity {
  @Column({ name: 'sede_id', type: 'int', nullable: false })
  sedeId: number

  @Column({ name: 'acceso_id', type: 'int', nullable: true })
  accesoId: number | null

  @Column({ name: 'autorizacion_id', type: 'int', nullable: true })
  autorizacionId: number | null

  @Column({ name: 'tipo_novedad', type: 'enum', enum: TipoNovedad, nullable: false })
  tipoNovedad: TipoNovedad

  @Column({ type: 'text', nullable: false })
  descripcion: string

  @Column({ type: 'varchar', length: 10, nullable: true })
  placa: string | null

  @Column({ name: 'persona_id', type: 'int', nullable: true })
  personaId: number | null

  @Column({ type: 'enum', enum: EstadoNovedad, nullable: false, default: EstadoNovedad.ABIERTA })
  estado: EstadoNovedad

  @Column({ name: 'accion_tomada', type: 'text', nullable: true })
  accionTomada: string | null

  @Column({ name: 'observacion_resolucion', type: 'text', nullable: true })
  observacionResolucion: string | null

  @Column({ name: 'reportado_por', type: 'int', nullable: false })
  reportadoPor: number

  @Column({ name: 'asignado_a', type: 'int', nullable: true })
  asignadoA: number | null

  @Column({ name: 'resuelto_por', type: 'int', nullable: true })
  resueltoPor: number | null

  @Column({ name: 'resuelta_en', type: 'datetime', nullable: true })
  resueltaEn: Date | null

  // ── Relaciones ──────────────────────────────────────────────────

  @ManyToOne(() => Sede, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sede_id' })
  sede: Sede

  @ManyToOne(() => ParkingAcceso, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'acceso_id' })
  acceso: ParkingAcceso | null

  @ManyToOne(() => ParkingAutorizacion, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'autorizacion_id' })
  autorizacion: ParkingAutorizacion | null

  @ManyToOne(() => Persona, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'persona_id' })
  persona: Persona | null

  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'reportado_por' })
  reportador: Usuario

  @ManyToOne(() => Usuario, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'asignado_a' })
  asignado: Usuario | null

  @ManyToOne(() => Usuario, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'resuelto_por' })
  resolutor: Usuario | null
}
