import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Usuario } from './usuario.entity';

/**
 * Perfil extendido del usuario del sistema.
 *
 * Equivalente a `class Perfil(BaseModel)` en Python (app/models/usuario.py).
 * Tabla: perfiles
 * Relación: 1:1 con Usuario.
 */
@Entity('perfiles')
export class Perfil extends BaseEntity {
  @Column({ name: 'usuario_id', type: 'int', unique: true, nullable: false })
  usuarioId: number;

  @Column({ name: 'foto_perfil', type: 'varchar', length: 500, nullable: true })
  fotoPerfil: string;

  @Column({ type: 'text', nullable: true })
  biografia: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  ubicacion: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono: string;

  @Column({ name: 'sede_default_id', type: 'int', nullable: true })
  sedeDefaultId: number;

  @Column({ type: 'varchar', length: 20, default: 'dark', nullable: false })
  tema: string;

  @Column({
    name: 'notificaciones_email',
    type: 'boolean',
    default: true,
    nullable: false,
  })
  notificacionesEmail: boolean;

  @OneToOne(() => Usuario, (usuario) => usuario.perfil, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;
}
