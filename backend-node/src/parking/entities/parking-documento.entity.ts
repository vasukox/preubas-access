import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { Usuario } from '../../auth/entities/usuario.entity'
import { TipoDocumentoVehiculo, EstadoDocumentoParking } from '../../common/enums/parking.enum'
import { ParkingSolicitud } from './parking-solicitud.entity'

@Entity('parking_documentos')
export class ParkingDocumento extends BaseEntity {
  @Column({ name: 'solicitud_id', type: 'int', nullable: false })
  solicitudId: number

  @Column({ name: 'tipo_documento', type: 'enum', enum: TipoDocumentoVehiculo, nullable: false })
  tipoDocumento: TipoDocumentoVehiculo

  @Column({ name: 'nombre_archivo', type: 'varchar', length: 255, nullable: false })
  nombreArchivo: string

  @Column({ name: 'ruta_archivo', type: 'varchar', length: 500, nullable: false })
  rutaArchivo: string

  @Column({ name: 'fecha_vencimiento', type: 'date', nullable: true })
  fechaVencimiento: Date | null

  @Column({ type: 'enum', enum: EstadoDocumentoParking, nullable: false, default: EstadoDocumentoParking.PENDIENTE })
  estado: EstadoDocumentoParking

  @Column({ name: 'cargado_por', type: 'int', nullable: false })
  cargadoPor: number

  @ManyToOne(() => ParkingSolicitud, (s) => s.documentos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'solicitud_id' })
  solicitud: ParkingSolicitud

  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cargado_por' })
  cargador: Usuario
}
