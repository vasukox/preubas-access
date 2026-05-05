import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { HseContratista } from './hse-contratista.entity';
import { Usuario } from '../../auth/entities/usuario.entity';
import { EstadoContratista } from '../../common/enums/hse.enum';

@Entity('hse_historial')
export class HseHistorial extends BaseEntity {
  @Column({ name: 'contratista_id', type: 'int', nullable: false })
  contratistaId: number;

  @Column({ name: 'estado_anterior', type: 'enum', enum: EstadoContratista, nullable: true })
  estadoAnterior: EstadoContratista;

  @Column({ name: 'estado_nuevo', type: 'enum', enum: EstadoContratista, nullable: false })
  estadoNuevo: EstadoContratista;

  @Column({ type: 'text', nullable: false })
  motivo: string;

  @Column({ name: 'cambiado_por', type: 'int', nullable: false })
  cambiadoPor: number;

  @ManyToOne(() => HseContratista, (contratista) => contratista.historial, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contratista_id' })
  contratista: HseContratista;

  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cambiado_por' })
  usuario: Usuario;
}
