import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { HseContratista } from './hse-contratista.entity';
import { Sede } from '../../sede/entities/sede.entity';
import { Usuario } from '../../auth/entities/usuario.entity';
import { Ubicacion } from '../../sede/entities/ubicacion.entity';
import { MetodoAcceso } from '../../common/enums/hse.enum';

@Entity('hse_accesos')
export class HseAcceso extends BaseEntity {
  @Column({ name: 'contratista_id', type: 'int', nullable: false })
  contratistaId: number;

  @Column({ name: 'sede_id', type: 'int', nullable: false })
  sedeId: number;

  @Column({ name: 'registrado_por', type: 'int', nullable: false })
  registradoPor: number;

  @Column({ name: 'tipo', type: 'varchar', length: 20, nullable: false, comment: 'ENTRADA / SALIDA' })
  tipoAcceso: string;

  @Column({ name: 'metodo', type: 'enum', enum: MetodoAcceso, nullable: false, default: MetodoAcceso.CEDULA_MANUAL })
  metodo: MetodoAcceso;

  @Column({ name: 'ubicacion_id', type: 'int', nullable: true })
  ubicacionId: number;

  @Column({ name: 'observacion', type: 'text', nullable: true })
  observacion: string;

  @Column({ name: 'fecha_hora', type: 'datetime', nullable: false })
  fechaHora: Date;

  @ManyToOne(() => HseContratista, (contratista) => contratista.accesos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contratista_id' })
  contratista: HseContratista;

  @ManyToOne(() => Sede, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sede_id' })
  sede: Sede;

  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'registrado_por' })
  usuarioRegistro: Usuario;

  @ManyToOne(() => Ubicacion, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'ubicacion_id' })
  ubicacion: Ubicacion;
}
