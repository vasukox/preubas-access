import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { HseContratista } from './hse-contratista.entity';
import { Usuario } from '../../auth/entities/usuario.entity';
import { Sede } from '../../sede/entities/sede.entity';
import { HseCumplimientoItem } from './hse-cumplimiento-item.entity';
import { CumplimientoEstado } from '../../common/enums/hse.enum';

@Entity('hse_cumplimiento')
export class HseCumplimiento extends BaseEntity {
  @Column({ name: 'contratista_id', type: 'int', nullable: false })
  contratistaId: number;

  @Column({ name: 'sede_id', type: 'int', nullable: false })
  sedeId: number;

  @Column({ name: 'encargado_id', type: 'int', nullable: false })
  encargadoId: number;

  @Column({ type: 'enum', enum: CumplimientoEstado, default: CumplimientoEstado.EN_PROGRESO, nullable: false })
  estado: CumplimientoEstado;

  @Column({ name: 'observacion_general', type: 'text', nullable: true })
  observacionGeneral: string;

  @Column({ name: 'fecha_inicio', type: 'datetime', nullable: false })
  fechaInicio: Date;

  @Column({ name: 'fecha_cierre', type: 'datetime', nullable: true })
  fechaCierre: Date;

  @Column({ name: 'firma_digital', type: 'varchar', length: 200, nullable: true })
  firmaDigital: string;

  @ManyToOne(() => HseContratista, (contratista) => contratista.cumplimientos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contratista_id' })
  contratista: HseContratista;

  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'encargado_id' })
  encargado: Usuario;

  @ManyToOne(() => Sede, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sede_id' })
  sede: Sede;

  @Column({ name: 'archivado', type: 'boolean', default: false })
  archivado: boolean;

  @OneToMany(() => HseCumplimientoItem, (item) => item.cumplimiento, { cascade: true })
  items: HseCumplimientoItem[];
}
