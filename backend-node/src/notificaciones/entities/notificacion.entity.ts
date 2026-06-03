import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Usuario } from '../../auth/entities/usuario.entity';

@Entity('notificaciones')
export class Notificacion extends BaseEntity {
  @Column({ name: 'usuario_id', type: 'int', nullable: false })
  usuarioId: number;

  @Column({ type: 'varchar', length: 50, nullable: false })
  tipo: string;

  @Column({ type: 'varchar', length: 200, nullable: false })
  titulo: string;

  @Column({ type: 'text', nullable: false })
  mensaje: string;

  @Column({ type: 'boolean', default: false, nullable: false })
  leida: boolean;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any> | null;

  // ── Relaciones ──────────────────────────────────────────────────

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;
}
