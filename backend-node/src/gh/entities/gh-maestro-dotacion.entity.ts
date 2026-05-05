import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Sede } from '../../sede/entities/sede.entity';

@Entity('gh_maestro_dotacion')
export class GhMaestroDotacion extends BaseEntity {
  @Column({ name: 'sede_id', type: 'int', nullable: true })
  sedeId: number;

  @Column({ type: 'varchar', length: 120, nullable: false })
  area: string;

  @Column({ type: 'varchar', length: 120, nullable: false })
  cargo: string;

  @Column({ name: 'tipo_contrato', type: 'varchar', length: 50, nullable: false })
  tipoContrato: string;

  @Column({ name: 'kit_codigo', type: 'varchar', length: 50, nullable: false })
  kitCodigo: string;

  @Column({ name: 'kit_descripcion', type: 'text', nullable: false })
  kitDescripcion: string;

  @Column({ type: 'boolean', default: true, nullable: false })
  activo: boolean;

  @ManyToOne(() => Sede, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sede_id' })
  sede: Sede;
}
