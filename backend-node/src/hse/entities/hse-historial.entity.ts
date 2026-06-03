import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { HseContratista } from './hse-contratista.entity';
import { Usuario } from '../../auth/entities/usuario.entity';

@Entity('hse_historial_estados')
export class HseHistorial extends BaseEntity {
  @Column({ name: 'contratista_id', type: 'int', nullable: false })
  contratistaId: number;

  @Column({ name: 'usuario_id', type: 'int', nullable: true })
  usuarioId: number | null;

  @Column({
    name: 'estado_anterior',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  estadoAnterior: string | null;

  @Column({
    name: 'estado_nuevo',
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  estadoNuevo: string;

  @Column({ type: 'text', nullable: true })
  motivo: string | null;

  @Column({ name: 'metadata_extra', type: 'json', nullable: true })
  metadataExtra: object | null;

  @ManyToOne(() => HseContratista, (contratista) => contratista.historial, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'contratista_id' })
  contratista: HseContratista;

  @ManyToOne(() => Usuario, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;
}
