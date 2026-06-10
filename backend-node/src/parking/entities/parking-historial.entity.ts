import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { Usuario } from '../../auth/entities/usuario.entity'
import { ParkingSolicitud } from './parking-solicitud.entity'

@Entity('parking_historial')
export class ParkingHistorial extends BaseEntity {
  @Column({ name: 'solicitud_id', type: 'int', nullable: true })
  solicitudId: number | null

  @Column({ name: 'autorizacion_id', type: 'int', nullable: true })
  autorizacionId: number | null

  @Column({ name: 'usuario_id', type: 'int', nullable: false })
  usuarioId: number

  @Column({ type: 'varchar', length: 50, nullable: false })
  evento: string

  @Column({ type: 'text', nullable: false })
  descripcion: string

  @Column({ name: 'estado_anterior', type: 'varchar', length: 50, nullable: true })
  estadoAnterior: string | null

  @Column({ name: 'estado_nuevo', type: 'varchar', length: 50, nullable: true })
  estadoNuevo: string | null

  @Column({ name: 'fecha_hora', type: 'datetime', nullable: false })
  fechaHora: Date

  @ManyToOne(() => ParkingSolicitud, (s) => s.historial, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'solicitud_id' })
  solicitud: ParkingSolicitud | null

  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario
}
