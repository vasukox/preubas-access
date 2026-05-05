import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { GhCandidato } from './gh-candidato.entity';
import { Usuario } from '../../auth/entities/usuario.entity';
import { GhDotacionEntregaDetalle } from './gh-dotacion-entrega-detalle.entity';
import { GhDotacionEntregaEstado } from '../../common/enums/gh.enum';

@Entity('gh_dotacion_entregas')
export class GhDotacionEntrega extends BaseEntity {
  @Column({ name: 'candidato_id', type: 'int', nullable: false })
  candidatoId: number;

  @Column({ name: 'sesion_o_cita_id', type: 'int', nullable: false })
  sesionOCitaId: number;

  @Column({ name: 'tipo_referencia', type: 'varchar', length: 20, nullable: false, comment: 'SESION o CITA' })
  tipoReferencia: string;

  @Column({ name: 'estado_entrega', type: 'enum', enum: GhDotacionEntregaEstado, default: GhDotacionEntregaEstado.PENDIENTE, nullable: false })
  estadoEntrega: GhDotacionEntregaEstado;

  @Column({ name: 'entregado_por_usuario_id', type: 'int', nullable: true })
  entregadoPorUsuarioId: number;

  @Column({ name: 'fecha_entrega', type: 'datetime', nullable: true })
  fechaEntrega: Date;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @ManyToOne(() => GhCandidato, (candidato) => candidato.dotacionEntregas, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'candidato_id' })
  candidato: GhCandidato;

  @ManyToOne(() => Usuario, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'entregado_por_usuario_id' })
  entregador: Usuario;

  @OneToMany(() => GhDotacionEntregaDetalle, (detalle) => detalle.entrega, { cascade: true })
  detalles: GhDotacionEntregaDetalle[];
}
