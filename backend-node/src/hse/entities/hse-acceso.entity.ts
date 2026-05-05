import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { HseContratista } from './hse-contratista.entity';
import { Sede } from '../../sede/entities/sede.entity';
import { Usuario } from '../../auth/entities/usuario.entity';

@Entity('hse_accesos')
export class HseAcceso extends BaseEntity {
  @Column({ name: 'contratista_id', type: 'int', nullable: false })
  contratistaId: number;

  @Column({ name: 'sede_id', type: 'int', nullable: false })
  sedeId: number;

  @Column({ name: 'registrado_por', type: 'int', nullable: false })
  registradoPor: number;

  @Column({ name: 'tipo_acceso', type: 'varchar', length: 20, nullable: false, comment: 'ENTRADA / SALIDA' })
  tipoAcceso: string;

  @Column({ name: 'fecha_hora', type: 'datetime', nullable: false })
  fechaHora: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  puerta: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @ManyToOne(() => HseContratista, (contratista) => contratista.accesos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contratista_id' })
  contratista: HseContratista;

  @ManyToOne(() => Sede, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sede_id' })
  sede: Sede;

  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'registrado_por' })
  usuarioRegistro: Usuario;
}
