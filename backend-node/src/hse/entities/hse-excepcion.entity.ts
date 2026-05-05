import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { HseContratista } from './hse-contratista.entity';
import { Usuario } from '../../auth/entities/usuario.entity';
import { Sede } from '../../sede/entities/sede.entity';

@Entity('hse_excepciones')
export class HseExcepcion extends BaseEntity {
  @Column({ name: 'contratista_id', type: 'int', nullable: false })
  contratistaId: number;

  @Column({ name: 'autorizador_id', type: 'int', nullable: false })
  autorizadorId: number;

  @Column({ name: 'sede_id', type: 'int', nullable: false })
  sedeId: number;

  @Column({ name: 'motivo_excepcion', type: 'text', nullable: false })
  motivoExcepcion: string;

  @Column({ name: 'fecha_validez_inicio', type: 'datetime', nullable: false })
  fechaValidezInicio: Date;

  @Column({ name: 'fecha_validez_fin', type: 'datetime', nullable: false })
  fechaValidezFin: Date;

  @Column({ name: 'es_activa', type: 'boolean', default: true })
  esActiva: boolean;

  @ManyToOne(() => HseContratista, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contratista_id' })
  contratista: HseContratista;

  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'autorizador_id' })
  autorizador: Usuario;

  @ManyToOne(() => Sede, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sede_id' })
  sede: Sede;
}
