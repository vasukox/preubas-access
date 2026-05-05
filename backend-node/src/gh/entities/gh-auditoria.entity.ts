import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Usuario } from '../../auth/entities/usuario.entity';
import { Sede } from '../../sede/entities/sede.entity';

@Entity('gh_auditoria')
export class GhAuditoria extends BaseEntity {
  @Column({ name: 'usuario_id', type: 'int', nullable: true })
  usuarioId: number;

  @Column({ name: 'sede_id', type: 'int', nullable: true })
  sedeId: number;

  @Column({ type: 'varchar', length: 60, nullable: false })
  accion: string;

  @Column({ type: 'varchar', length: 60, nullable: false })
  entidad: string;

  @Column({ name: 'entidad_id', type: 'int', nullable: true })
  entidadId: number;

  @Column({ type: 'json', nullable: true })
  detalle: Record<string, any>;

  @ManyToOne(() => Usuario, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @ManyToOne(() => Sede, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sede_id' })
  sede: Sede;
}
