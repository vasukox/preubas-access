import { Entity, Column, ManyToOne, OneToMany, OneToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { Sede } from '../../sede/entities/sede.entity'
import { Persona } from '../../persona/entities/persona.entity'
import { Usuario } from '../../auth/entities/usuario.entity'
import {
  EstadoSolicitudParking,
  TipoUsuarioParking,
  TipoVehiculo,
} from '../../common/enums/parking.enum'
import { ParkingDocumento } from './parking-documento.entity'
import { ParkingHistorial } from './parking-historial.entity'

@Entity('parking_solicitudes')
export class ParkingSolicitud extends BaseEntity {
  @Column({ type: 'varchar', length: 20, unique: true, nullable: false, comment: 'PKG-2026-XXXX' })
  codigo: string

  @Column({ name: 'sede_id', type: 'int', nullable: false })
  sedeId: number

  @Column({ name: 'persona_id', type: 'int', nullable: true })
  personaId: number | null

  @Column({ name: 'creado_por', type: 'int', nullable: false })
  creadoPor: number

  @Column({ name: 'tipo_usuario', type: 'enum', enum: TipoUsuarioParking, nullable: false })
  tipoUsuario: TipoUsuarioParking

  @Column({ name: 'tipo_vehiculo', type: 'enum', enum: TipoVehiculo, nullable: false })
  tipoVehiculo: TipoVehiculo

  @Column({ type: 'varchar', length: 10, nullable: false })
  placa: string

  @Column({ name: 'solicitante_nombre', type: 'varchar', length: 200, nullable: true })
  solicitanteNombre: string | null

  @Column({ name: 'solicitante_cedula', type: 'varchar', length: 20, nullable: true })
  solicitanteCedula: string | null

  @Column({ type: 'varchar', length: 50, nullable: true })
  marca: string | null

  @Column({ type: 'varchar', length: 50, nullable: true })
  linea: string | null

  @Column({ type: 'varchar', length: 30, nullable: true })
  color: string | null

  @Column({ name: 'modelo_anio', type: 'smallint', nullable: true })
  modeloAnio: number | null

  @Column({ name: 'horario_requerido', type: 'varchar', length: 100, nullable: true })
  horarioRequerido: string | null

  @Column({ name: 'dias_requeridos', type: 'text', nullable: true, comment: 'JSON: ["LUNES","MARTES"]' })
  diasRequeridos: string | null

  @Column({ name: 'fecha_inicio', type: 'date', nullable: false })
  fechaInicio: Date

  @Column({ name: 'fecha_fin', type: 'date', nullable: false })
  fechaFin: Date

  @Column({ type: 'text', nullable: true })
  motivo: string | null

  @Column({ type: 'enum', enum: EstadoSolicitudParking, nullable: false, default: EstadoSolicitudParking.BORRADOR })
  estado: EstadoSolicitudParking

  @Column({ name: 'token_autogestion', type: 'varchar', length: 64, unique: true, nullable: true })
  tokenAutogestion: string | null

  @Column({ name: 'token_expira_en', type: 'datetime', nullable: true })
  tokenExpiraEn: Date | null

  @Column({ name: 'autogestion_completada_en', type: 'datetime', nullable: true })
  autogestionCompletadaEn: Date | null

  @Column({ name: 'aprobado_por', type: 'int', nullable: true })
  aprobadoPor: number | null

  @Column({ name: 'aprobado_en', type: 'datetime', nullable: true })
  aprobadoEn: Date | null

  @Column({ name: 'motivo_denegacion', type: 'text', nullable: true })
  motivoDenegacion: string | null

  @Column({ name: 'observaciones_internas', type: 'text', nullable: true })
  observacionesInternas: string | null

  // ── Relaciones ──────────────────────────────────────────────────

  @ManyToOne(() => Sede, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sede_id' })
  sede: Sede

  @ManyToOne(() => Persona, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'persona_id' })
  persona: Persona | null

  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'creado_por' })
  creador: Usuario

  @ManyToOne(() => Usuario, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'aprobado_por' })
  aprobador: Usuario | null

  @OneToMany(() => ParkingDocumento, (d) => d.solicitud, { cascade: true })
  documentos: ParkingDocumento[]

  @OneToMany(() => ParkingHistorial, (h) => h.solicitud, { cascade: true })
  historial: ParkingHistorial[]
}
