import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { Sede } from '../../sede/entities/sede.entity'

@Entity('parking_politicas_sede')
export class ParkingPoliticaSede extends BaseEntity {
  @Column({ name: 'sede_id', type: 'int', nullable: false, unique: true })
  sedeId: number

  @Column({ name: 'max_vehiculos_por_persona', type: 'int', nullable: false, default: 1 })
  maxVehiculosPorPersona: number

  @Column({ name: 'requiere_soat', type: 'boolean', nullable: false, default: true })
  requiereSoat: boolean

  @Column({ name: 'requiere_tecnomecanica', type: 'boolean', nullable: false, default: true })
  requiereTecnomecanica: boolean

  @Column({ name: 'requiere_licencia', type: 'boolean', nullable: false, default: true })
  requiereLicencia: boolean

  @Column({ name: 'dias_alerta_vencimiento_docs', type: 'int', nullable: false, default: 30 })
  diasAlertaVencimientoDocs: number

  @Column({ name: 'permite_vehiculo_reemplazo', type: 'boolean', nullable: false, default: true })
  permiteVehiculoReemplazo: boolean

  @Column({ name: 'permite_entrada_unica_visitantes', type: 'boolean', nullable: false, default: true })
  permiteEntradaUnicaVisitantes: boolean

  @Column({ name: 'requiere_aprobacion_jefe', type: 'boolean', nullable: false, default: false })
  requiereAprobacionJefe: boolean

  @Column({ name: 'horario_inicio_operacion', type: 'varchar', length: 5, nullable: false, default: '06:00' })
  horarioInicioOperacion: string

  @Column({ name: 'horario_fin_operacion', type: 'varchar', length: 5, nullable: false, default: '22:00' })
  horarioFinOperacion: string

  @Column({ type: 'boolean', nullable: false, default: true })
  activa: boolean

  @ManyToOne(() => Sede, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sede_id' })
  sede: Sede
}
