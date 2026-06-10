import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { Sede } from '../../sede/entities/sede.entity'
import { Persona } from '../../persona/entities/persona.entity'
import { Usuario } from '../../auth/entities/usuario.entity'
import { ParkingZona } from './parking-zona.entity'
import { TipoExcepcion, AlcanceExcepcion } from '../../common/enums/parking.enum'

@Entity('parking_excepciones')
export class ParkingExcepcion extends BaseEntity {
  @Column({ name: 'sede_id', type: 'int', nullable: false })
  sedeId: number

  @Column({ name: 'tipo_excepcion', type: 'enum', enum: TipoExcepcion, nullable: false })
  tipoExcepcion: TipoExcepcion

  @Column({ type: 'enum', enum: AlcanceExcepcion, nullable: false })
  alcance: AlcanceExcepcion

  @Column({ type: 'varchar', length: 10, nullable: true })
  placa: string | null

  @Column({ name: 'persona_id', type: 'int', nullable: true })
  personaId: number | null

  @Column({ name: 'nombre_persona', type: 'varchar', length: 200, nullable: true })
  nombrePersona: string | null

  @Column({ type: 'text', nullable: false })
  motivo: string

  @Column({ name: 'aprobado_por', type: 'int', nullable: false })
  aprobadoPor: number

  @Column({ name: 'fecha_inicio', type: 'date', nullable: false })
  fechaInicio: Date

  @Column({ name: 'fecha_fin', type: 'date', nullable: false })
  fechaFin: Date

  @Column({ name: 'horario_inicio', type: 'varchar', length: 5, nullable: true })
  horarioInicio: string | null

  @Column({ name: 'horario_fin', type: 'varchar', length: 5, nullable: true })
  horarioFin: string | null

  @Column({ name: 'zona_id', type: 'int', nullable: true })
  zonaId: number | null

  @Column({ name: 'usos_permitidos', type: 'int', nullable: true, comment: 'null = ilimitado en el rango' })
  usosPermitidos: number | null

  @Column({ name: 'usos_realizados', type: 'int', nullable: false, default: 0 })
  usosRealizados: number

  @Column({ type: 'boolean', nullable: false, default: true })
  activa: boolean

  // ── Relaciones ──────────────────────────────────────────────────

  @ManyToOne(() => Sede, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sede_id' })
  sede: Sede

  @ManyToOne(() => Persona, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'persona_id' })
  persona: Persona | null

  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'aprobado_por' })
  aprobador: Usuario

  @ManyToOne(() => ParkingZona, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'zona_id' })
  zona: ParkingZona | null
}
