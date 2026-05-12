import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { HseContratista } from './hse-contratista.entity';
import { CatEps } from './cat-eps.entity';
import { CatArl } from './cat-arl.entity';
import { CatAfp } from './cat-afp.entity';
import { PilaTipo, PilaEstado } from '../../common/enums/hse.enum';

@Entity('hse_seguridad_social')
export class HseSegSocial extends BaseEntity {
  @Column({ name: 'contratista_id', type: 'int' })
  contratistaId: number;

  @Column({ name: 'es_titular', type: 'boolean', default: true })
  esTitular: boolean;

  @Column({ name: 'nombre_persona', type: 'varchar', length: 150, nullable: true })
  nombrePersona: string;

  @Column({ name: 'cedula_persona', type: 'varchar', length: 30, nullable: true })
  cedulaPersona: string;

  @Column({ name: 'eps_id', type: 'int', nullable: true })
  epsId: number;

  @Column({ name: 'eps_vigencia', type: 'date', nullable: true })
  epsVigencia: Date;

  @Column({ name: 'arl_id', type: 'int', nullable: true })
  arlId: number;

  @Column({ name: 'arl_vigencia', type: 'date', nullable: true })
  arlVigencia: Date;

  @Column({ name: 'afp_id', type: 'int', nullable: true })
  afpId: number;

  @Column({ name: 'afp_vigencia', type: 'date', nullable: true })
  afpVigencia: Date;

  @Column({ name: 'pila_tipo', type: 'enum', enum: PilaTipo, nullable: true })
  pilaTipo: PilaTipo;

  @Column({ name: 'pila_estado', type: 'enum', enum: PilaEstado, nullable: true })
  pilaEstado: PilaEstado;

  @Column({ name: 'pila_archivo', type: 'varchar', length: 500, nullable: true })
  pilaArchivo: string;

  @Column({ name: 'sst_tiene_vigente', type: 'boolean', default: false })
  sstTieneVigente: boolean;

  @Column({ name: 'sst_responsable_nombre', type: 'varchar', length: 150, nullable: true })
  sstResponsableNombre: string;

  @Column({ name: 'sst_resolucion_registro', type: 'varchar', length: 100, nullable: true })
  sstResolucionRegistro: string;

  @ManyToOne(() => HseContratista, (contratista) => contratista.seguridadSocial, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contratista_id' })
  contratista: HseContratista;

  @ManyToOne(() => CatEps, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'eps_id' })
  eps: CatEps;

  @ManyToOne(() => CatArl, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'arl_id' })
  arl: CatArl;

  @ManyToOne(() => CatAfp, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'afp_id' })
  afp: CatAfp;
}
