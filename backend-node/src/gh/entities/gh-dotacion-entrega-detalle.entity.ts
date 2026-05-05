import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { GhDotacionEntrega } from './gh-dotacion-entrega.entity';
import { GhDotacionItemEstado } from '../../common/enums/gh.enum';

@Entity('gh_dotacion_entregas_detalle')
export class GhDotacionEntregaDetalle extends BaseEntity {
  @Column({ name: 'entrega_id', type: 'int', nullable: false })
  entregaId: number;

  @Column({ name: 'item_codigo', type: 'varchar', length: 50, nullable: false })
  itemCodigo: string;

  @Column({ name: 'item_nombre', type: 'varchar', length: 200, nullable: false })
  itemNombre: string;

  @Column({ name: 'cantidad_esperada', type: 'int', default: 1, nullable: false })
  cantidadEsperada: number;

  @Column({ name: 'cantidad_entregada', type: 'int', default: 0, nullable: false })
  cantidadEntregada: number;

  @Column({ name: 'estado_item', type: 'enum', enum: GhDotacionItemEstado, default: GhDotacionItemEstado.PENDIENTE, nullable: false })
  estadoItem: GhDotacionItemEstado;

  @Column({ name: 'evidencia_url', type: 'text', nullable: true })
  evidenciaUrl: string;

  @ManyToOne(() => GhDotacionEntrega, (entrega) => entrega.detalles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'entrega_id' })
  entrega: GhDotacionEntrega;
}
