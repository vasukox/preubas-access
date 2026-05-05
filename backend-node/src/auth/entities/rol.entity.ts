import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { RolNombre } from '../../common/enums/rol.enum';
import { UsuarioRol } from './usuario-rol.entity';

/**
 * Catálogo de roles del sistema.
 *
 * Equivalente a `class Rol(BaseModel)` en Python (app/models/usuario.py).
 * Tabla: cat_roles
 */
@Entity('cat_roles')
export class Rol extends BaseEntity {
  @Column({ type: 'enum', enum: RolNombre, unique: true, nullable: false })
  nombre: RolNombre;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion: string;

  @Column({ type: 'boolean', default: true, nullable: false })
  activo: boolean;

  @OneToMany(() => UsuarioRol, (usuarioRol) => usuarioRol.rol, {
    cascade: true,
  })
  usuarioRoles: UsuarioRol[];
}