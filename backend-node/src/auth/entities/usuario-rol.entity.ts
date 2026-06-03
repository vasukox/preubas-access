import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Usuario } from './usuario.entity';
import { Rol } from './rol.entity';

/**
 * Tabla pivot N:M entre Usuario y Rol.
 *
 * Equivalente a `class UsuarioRol(BaseModel)` en Python (app/models/usuario.py).
 * Tabla: usuario_roles
 */
@Entity('usuario_roles')
@Unique('uq_usuario_rol', ['usuarioId', 'rolId'])
export class UsuarioRol extends BaseEntity {
  @Column({ name: 'usuario_id', type: 'int', nullable: false })
  usuarioId: number;

  @Column({ name: 'rol_id', type: 'int', nullable: false })
  rolId: number;

  @Column({ name: 'asignado_por', type: 'int', nullable: true })
  asignadoPor: number;

  @ManyToOne(() => Usuario, (usuario) => usuario.roles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @ManyToOne(() => Rol, (rol) => rol.usuarioRoles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'rol_id' })
  rol: Rol;
}
