import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Usuario } from './usuario.entity';

/**
 * Tokens de refresco activos por usuario.
 *
 * Equivalente a `class RefreshToken(BaseModel)` en Python (app/models/usuario.py).
 * Tabla: refresh_tokens
 */
@Entity('refresh_tokens')
export class RefreshToken extends BaseEntity {
  @Column({ name: 'usuario_id', type: 'int', nullable: false })
  usuarioId: number;

  @Column({ type: 'varchar', length: 36, unique: true, nullable: false })
  jti: string;

  @Column({ type: 'boolean', default: false, nullable: false })
  revocado: boolean;

  @Column({ name: 'expira_en', type: 'datetime', nullable: false })
  expiraEn: Date;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  @ManyToOne(() => Usuario, (usuario) => usuario.refreshTokens, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;
}
