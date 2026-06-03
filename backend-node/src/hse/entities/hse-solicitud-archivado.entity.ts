import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { HseContratista } from './hse-contratista.entity';
import { Usuario } from '../../auth/entities/usuario.entity';
import { SolicitudArchivadoEstado } from '../../common/enums/hse.enum';

@Entity('hse_solicitudes_archivado')
export class HseSolicitudArchivado extends BaseEntity {
  @Column({ name: 'contratista_id', type: 'int', nullable: false })
  contratistaId: number;

  @Column({
    type: 'enum',
    enum: SolicitudArchivadoEstado,
    default: SolicitudArchivadoEstado.PENDIENTE,
    nullable: false,
  })
  estado: SolicitudArchivadoEstado;

  @Column({ type: 'text', nullable: true })
  motivo: string | null;

  @Column({
    name: 'firma_digital',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  firmaDigital: string | null;

  @Column({ name: 'resuelto_por', type: 'int', nullable: true })
  resolvidoPor: number | null;

  @Column({ name: 'fecha_resolucion', type: 'datetime', nullable: true })
  fechaResolucion: Date | null;

  @Column({
    name: 'notificacion_enviada',
    type: 'boolean',
    default: false,
    nullable: false,
  })
  notificacionEnviada: boolean;

  // ── Relaciones ──────────────────────────────────────────────────

  @ManyToOne(() => HseContratista, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contratista_id' })
  contratista: HseContratista;

  @ManyToOne(() => Usuario, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'resuelto_por' })
  resolutor: Usuario;
}
