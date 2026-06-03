import {
  Entity,
  Column,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { HseAutorizacion } from './hse-autorizacion.entity';
import { Persona } from '../../persona/entities/persona.entity';
import { TipoDocumento, EstadoContratista } from '../../common/enums/hse.enum';

// Importaciones pendientes de los modelos de autogestión y operación
import { HseClasificacion } from './hse-clasificacion.entity';
import { HseSegSocial } from './hse-seg-social.entity';
import { HseCertificaciones } from './hse-certificaciones.entity';
import { HseExamenMedico } from './hse-examen-medico.entity';
import { HseContactoEmergencia } from './hse-contacto-emergencia.entity';
import { HseAceptacionNormas } from './hse-aceptacion-normas.entity';
import { HseAcceso } from './hse-acceso.entity';
import { HseCumplimiento } from './hse-cumplimiento.entity';
import { HseHistorial } from './hse-historial.entity';

@Entity('hse_contratistas')
export class HseContratista extends BaseEntity {
  @Column({ name: 'autorizacion_id', type: 'int', nullable: false })
  autorizacionId: number;

  @Column({
    name: 'persona_id',
    type: 'int',
    nullable: true,
    comment: 'Se vincula cuando la persona ya existe en BD',
  })
  personaId: number;

  @Column({
    name: 'tipo_documento',
    type: 'enum',
    enum: TipoDocumento,
    nullable: false,
  })
  tipoDocumento: TipoDocumento;

  @Column({
    name: 'numero_documento',
    type: 'varchar',
    length: 30,
    nullable: false,
  })
  numeroDocumento: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  nombres: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  apellidos: string;

  @Column({ type: 'varchar', length: 150, nullable: false })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono: string;

  @Column({
    name: 'es_extranjero',
    type: 'boolean',
    default: false,
    nullable: false,
  })
  esExtranjero: boolean;

  @Column({
    type: 'enum',
    enum: EstadoContratista,
    default: EstadoContratista.PENDIENTE_AUTOGESTION,
    nullable: false,
  })
  estado: EstadoContratista;

  @Column({ name: 'motivo_denegacion', type: 'text', nullable: true })
  motivoDenegacion: string;

  @Column({
    name: 'token_autogestion',
    type: 'varchar',
    length: 64,
    unique: true,
    nullable: true,
  })
  tokenAutogestion: string;

  @Column({ name: 'token_expira_en', type: 'datetime', nullable: true })
  tokenExpiraEn: Date;

  @Column({
    name: 'token_duracion_horas',
    type: 'int',
    nullable: true,
    comment: '24, 48, 72 o personalizado',
  })
  tokenDuracionHoras: number;

  @Column({
    name: 'autogestion_completada_en',
    type: 'datetime',
    nullable: true,
  })
  autogestionCompletadaEn: Date;

  @Column({
    name: 'sst_responsable_nombre',
    type: 'varchar',
    length: 150,
    nullable: true,
  })
  sstResponsableNombre: string;

  @Column({
    name: 'sst_responsable_telefono',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  sstResponsableTelefono: string;

  // ── Relaciones ──────────────────────────────────────────────────

  @ManyToOne(
    () => HseAutorizacion,
    (autorizacion) => autorizacion.contratistas,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'autorizacion_id' })
  autorizacion: HseAutorizacion;

  @ManyToOne(() => Persona, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'persona_id' })
  persona: Persona;

  @OneToOne(
    () => HseClasificacion,
    (clasificacion) => clasificacion.contratista,
    { cascade: true },
  )
  clasificacion: HseClasificacion;

  @OneToMany(() => HseSegSocial, (segSocial) => segSocial.contratista, {
    cascade: true,
  })
  seguridadSocial: HseSegSocial[];

  @OneToOne(() => HseCertificaciones, (cert) => cert.contratista, {
    cascade: true,
  })
  certificaciones: HseCertificaciones;

  @OneToOne(() => HseExamenMedico, (examen) => examen.contratista, {
    cascade: true,
  })
  examenMedico: HseExamenMedico;

  @OneToOne(() => HseContactoEmergencia, (contacto) => contacto.contratista, {
    cascade: true,
  })
  contactoEmergencia: HseContactoEmergencia;

  @OneToOne(() => HseAceptacionNormas, (aceptacion) => aceptacion.contratista, {
    cascade: true,
  })
  aceptacionNormas: HseAceptacionNormas;

  @OneToMany(() => HseAcceso, (acceso) => acceso.contratista, { cascade: true })
  accesos: HseAcceso[];

  @OneToMany(
    () => HseCumplimiento,
    (cumplimiento) => cumplimiento.contratista,
    { cascade: true },
  )
  cumplimientos: HseCumplimiento[];

  @OneToMany(() => HseHistorial, (historial) => historial.contratista, {
    cascade: true,
  })
  historial: HseHistorial[];
}
