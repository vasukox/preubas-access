import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Usuario } from './usuario.entity';
import { Sede } from '../../sede/entities/sede.entity';

/**
 * Sedes operativas asignadas a un usuario (vigilante u otros con alcance por sede).
 * Tabla: usuario_sedes
 */
@Entity('usuario_sedes')
@Unique('uq_usuario_sede', ['usuarioId', 'sedeId'])
export class UsuarioSede extends BaseEntity {
  @Column({ name: 'usuario_id', type: 'int', nullable: false })
  usuarioId: number;

  @Column({ name: 'sede_id', type: 'int', nullable: false })
  sedeId: number;

  @ManyToOne(() => Usuario, (usuario) => usuario.sedesAsignadas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @ManyToOne(() => Sede, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sede_id' })
  sede: Sede;
}
