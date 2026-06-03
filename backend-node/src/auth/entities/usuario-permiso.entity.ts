import { Entity, Column, OneToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Usuario } from './usuario.entity';

/**
 * Permisos operativos granulares por usuario.
 *
 * Equivalente a `class UsuarioPermiso(BaseModel)` en Python (app/models/usuario.py).
 * Tabla: usuario_permisos
 * Relación: 1:1 con Usuario.
 */
@Entity('usuario_permisos')
@Unique('uq_usuario_permisos_unico', ['usuarioId'])
export class UsuarioPermiso extends BaseEntity {
  @Column({ name: 'usuario_id', type: 'int', unique: true, nullable: false })
  usuarioId: number;

  @Column({
    name: 'puede_ver',
    type: 'boolean',
    default: true,
    nullable: false,
  })
  puedeVer: boolean;

  @Column({
    name: 'puede_crear',
    type: 'boolean',
    default: false,
    nullable: false,
  })
  puedeCrear: boolean;

  @Column({
    name: 'puede_editar',
    type: 'boolean',
    default: false,
    nullable: false,
  })
  puedeEditar: boolean;

  @Column({
    name: 'puede_eliminar',
    type: 'boolean',
    default: false,
    nullable: false,
  })
  puedeEliminar: boolean;

  @Column({ name: 'asignado_por', type: 'int', nullable: true })
  asignadoPor: number;

  @OneToOne(() => Usuario, (usuario) => usuario.permisos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;
}
