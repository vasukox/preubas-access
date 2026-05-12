import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { GhCandidato } from './gh-candidato.entity';
import { GhMaestroDotacion } from './gh-maestro-dotacion.entity';
import { Usuario } from '../../auth/entities/usuario.entity';
import { GhDotacionEntregaDetalle } from './gh-dotacion-entrega-detalle.entity';
import { GhDotacionEntregaEstado } from '../../common/enums/gh.enum';

@Entity('gh_dotacion_entregas')
export class GhDotacionEntrega extends BaseEntity {
  @Column({ name: 'candidato_id', type: 'int', nullable: false })
  candidatoId: number;

  @Column({ name: 'maestro_dotacion_id', type: 'int', nullable: true })
  maestroDotacionId: number | null;

  @Column({ name: 'sesion_o_cita_id', type: 'int', nullable: true })
  sesionOCitaId: number | null;

  @Column({ name: 'tipo_referencia', type: 'varchar', length: 20, nullable: true, comment: 'SESION | CITA | DIRECTO' })
  tipoReferencia: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  area: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  cargo: string | null;

  @Column({ name: 'estado_entrega', type: 'enum', enum: GhDotacionEntregaEstado, default: GhDotacionEntregaEstado.PENDIENTE, nullable: false })
  estadoEntrega: GhDotacionEntregaEstado;

  @Column({ name: 'entregado_por_usuario_id', type: 'int', nullable: true })
  entregadoPorUsuarioId: number | null;

  @Column({ name: 'fecha_entrega', type: 'datetime', nullable: true })
  fechaEntrega: Date | null;

  @Column({ type: 'text', nullable: true })
  observaciones: string | null;

  @ManyToOne(() => GhCandidato, (candidato) => candidato.dotacionEntregas, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'candidato_id' })
  candidato: GhCandidato;

  @ManyToOne(() => GhMaestroDotacion, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'maestro_dotacion_id' })
  maestroDotacion: GhMaestroDotacion | null;

  @ManyToOne(() => Usuario, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'entregado_por_usuario_id' })
  entregador: Usuario | null;

  @OneToMany(() => GhDotacionEntregaDetalle, (detalle) => detalle.entrega, { cascade: true })
  detalles: GhDotacionEntregaDetalle[];
}
