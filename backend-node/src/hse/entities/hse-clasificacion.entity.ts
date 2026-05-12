import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { HseContratista } from './hse-contratista.entity';
import { AlturasNivel, ConfinadosRol, ElectricoMatricula } from '../../common/enums/hse.enum';

@Entity('hse_clasificacion_actividad')
export class HseClasificacion extends BaseEntity {
  @Column({ name: 'contratista_id', type: 'int', unique: true })
  contratistaId: number;

  // 8 preguntas de clasificación
  @Column({ name: 'trabajo_alturas', type: 'boolean', default: false })
  trabajoAlturas: boolean;

  @Column({ name: 'espacios_confinados', type: 'boolean', default: false })
  espaciosConfinados: boolean;

  @Column({ name: 'trabajo_electrico', type: 'boolean', default: false })
  trabajoElectrico: boolean;

  @Column({ name: 'trabajo_caliente', type: 'boolean', default: false })
  trabajoCaliente: boolean;

  @Column({ name: 'izaje_maquinaria', type: 'boolean', default: false })
  izajeMaquinaria: boolean;

  @Column({ name: 'visita_sin_riesgo', type: 'boolean', default: false })
  visitaSinRiesgo: boolean;

  @Column({ name: 'personal_extranjero', type: 'boolean', default: false })
  personalExtranjero: boolean;

  @Column({ name: 'genera_residuos', type: 'boolean', default: false })
  generaResiduos: boolean;

  // Alturas
  @Column({ name: 'alturas_nivel', type: 'enum', enum: AlturasNivel, nullable: true })
  alturasNivel: AlturasNivel;

  @Column({ name: 'alturas_cert_fecha_venc', type: 'date', nullable: true })
  alturasCertFechaVenc: Date;

  @Column({ name: 'alturas_cert_archivo', type: 'varchar', length: 500, nullable: true })
  alturasCertArchivo: string;

  // Espacios confinados
  @Column({ name: 'confinados_rol', type: 'enum', enum: ConfinadosRol, nullable: true })
  confinadosRol: ConfinadosRol;

  @Column({ name: 'confinados_cert_fecha', type: 'date', nullable: true })
  confinadosCertFecha: Date;

  @Column({ name: 'confinados_cert_archivo', type: 'varchar', length: 500, nullable: true })
  confinadosCertArchivo: string;

  // Trabajo eléctrico
  @Column({ name: 'electrico_matricula_contec', type: 'enum', enum: ElectricoMatricula, nullable: true })
  electricoMatriculaContec: ElectricoMatricula;

  @Column({ name: 'electrico_num_matricula', type: 'varchar', length: 50, nullable: true })
  electricoNumMatricula: string;

  @Column({ name: 'electrico_matricula_venc', type: 'date', nullable: true })
  electricoMatriculaVenc: Date;

  @Column({ name: 'electrico_matricula_archivo', type: 'varchar', length: 500, nullable: true })
  electricoMatriculaArchivo: string;

  // Trabajo en caliente
  @Column({ name: 'caliente_extintor_fecha', type: 'date', nullable: true })
  calienteExtintorFecha: Date;

  @Column({ name: 'caliente_extintor_archivo', type: 'varchar', length: 500, nullable: true })
  calienteExtintorArchivo: string;

  @Column({ name: 'caliente_permiso_fecha', type: 'date', nullable: true })
  calientePermisoFecha: Date;

  @Column({ name: 'caliente_permiso_archivo', type: 'varchar', length: 500, nullable: true })
  calientePermisoArchivo: string;

  // Izaje
  @Column({ name: 'izaje_tipo_equipo', type: 'varchar', length: 100, nullable: true })
  izajeTipoEquipo: string;

  @Column({ name: 'izaje_inspeccion_archivo', type: 'varchar', length: 500, nullable: true })
  izajeInspeccionArchivo: string;

  @Column({ name: 'izaje_doc_legal_archivo', type: 'varchar', length: 500, nullable: true })
  izajeDocLegalArchivo: string;

  @Column({ name: 'izaje_licencia_archivo', type: 'varchar', length: 500, nullable: true })
  izajeLicenciaArchivo: string;

  // Extranjero
  @Column({ name: 'extran_aseguradora', type: 'varchar', length: 150, nullable: true })
  extranAseguradora: string;

  @Column({ name: 'extran_num_poliza', type: 'varchar', length: 100, nullable: true })
  extranNumPoliza: string;

  @Column({ name: 'extran_poliza_venc', type: 'date', nullable: true })
  extranPolizaVenc: Date;

  @Column({ name: 'extran_poliza_archivo', type: 'varchar', length: 500, nullable: true })
  extranPolizaArchivo: string;

  // Residuos
  @Column({ name: 'residuos_tipo', type: 'varchar', length: 200, nullable: true })
  residuosTipo: string;

  @Column({ name: 'residuos_plan_archivo', type: 'varchar', length: 500, nullable: true })
  residuosPlanArchivo: string;

  @OneToOne(() => HseContratista, (contratista) => contratista.clasificacion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contratista_id' })
  contratista: HseContratista;
}
