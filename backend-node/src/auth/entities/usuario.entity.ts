import { Entity, Column, ManyToOne, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Sede } from '../../sede/entities/sede.entity';
import { UsuarioRol } from './usuario-rol.entity';
import { RefreshToken } from './refresh-token.entity';
import { Perfil } from './perfil.entity';
import { UsuarioPermiso } from './usuario-permiso.entity';

/**
 * Cuenta de acceso al sistema KOAJ Access.
 *
 * Equivalente a `class Usuario(BaseModel)` en Python (app/models/usuario.py).
 * Tabla: usuarios
 *
 * Relaciones:
 *   - roles:         1:N con UsuarioRol
 *   - refreshTokens: 1:N con RefreshToken
 *   - perfil:        1:1 con Perfil
 *   - permisos:      1:1 con UsuarioPermiso
 *   - sedeAsignada:  N:1 con Sede
 */
@Entity('usuarios')
export class Usuario extends BaseEntity {
  @Column({ type: 'varchar', length: 150, unique: true, nullable: false })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, nullable: false })
  passwordHash: string;

  @Column({
    name: 'nombre_completo',
    type: 'varchar',
    length: 150,
    nullable: false,
  })
  nombreCompleto: string;

  @Column({ type: 'boolean', default: true, nullable: false })
  activo: boolean;

  @Column({
    name: 'debe_cambiar_password',
    type: 'boolean',
    default: true,
    nullable: false,
  })
  debeCambiarPassword: boolean;

  @Column({ name: 'ultimo_login', type: 'datetime', nullable: true })
  ultimoLogin: Date | null;

  @Column({
    name: 'intentos_fallidos',
    type: 'int',
    default: 0,
    nullable: false,
  })
  intentosFallidos: number;

  @Column({ name: 'bloqueado_hasta', type: 'datetime', nullable: true })
  bloqueadoHasta: Date | null;

  @Column({ name: 'sede_asignada_id', type: 'int', nullable: true })
  sedeAsignadaId: number | null;


  // ── Relaciones ──────────────────────────────────────────────────

  @ManyToOne(() => Sede, { nullable: true })
  @JoinColumn({ name: 'sede_asignada_id' })
  sedeAsignada: Sede;

  @OneToMany(() => UsuarioRol, (usuarioRol) => usuarioRol.usuario, {
    cascade: true,
  })
  roles: UsuarioRol[];

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.usuario, {
    cascade: true,
  })
  refreshTokens: RefreshToken[];

  @OneToOne(() => Perfil, (perfil) => perfil.usuario, {
    cascade: true,
  })
  perfil: Perfil;

  @OneToOne(() => UsuarioPermiso, (permiso) => permiso.usuario, {
    cascade: true,
  })
  permisos: UsuarioPermiso;
}