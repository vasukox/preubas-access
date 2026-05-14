import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum TipoContratistaConfig {
  NORMAL      = 'NORMAL',
  ALTO_RIESGO = 'ALTO_RIESGO',
  EXCEPCION   = 'EXCEPCION',
}

/**
 * ConfigTiemposContratista — una fila por tipo de contratista (NORMAL, ALTO_RIESGO, EXCEPCION).
 *
 * Almacena los parámetros de tiempo y requisitos configurables por tipo.
 * El servicio garantiza que existan las 3 filas; si faltan, las crea con valores por defecto.
 */
@Entity('config_tiempos_contratista')
export class ConfigTiemposContratista extends BaseEntity {
  @Column({
    name: 'tipo_contratista',
    type: 'enum',
    enum: TipoContratistaConfig,
    unique: true,
  })
  tipoContratista: TipoContratistaConfig;

  /** Vigencia del enlace de autogestión enviado al contratista (horas). */
  @Column({ name: 'token_duracion_horas', type: 'int', default: 72 })
  tokenDuracionHoras: number;

  /** Duración máxima que puede tener una autorización de este tipo (días). */
  @Column({ name: 'autorizacion_duracion_dias', type: 'int', default: 30 })
  autorizacionDuracionDias: number;

  /** Cuántos días antes del vencimiento se muestra la alerta. */
  @Column({ name: 'alerta_vencimiento_dias', type: 'int', default: 3 })
  alertaVencimientoDias: number;

  /** Si este tipo de contratista debe adjuntar examen médico. */
  @Column({ name: 'requiere_examen_medico', type: 'boolean', default: false })
  requiereExamenMedico: boolean;

  /** Si este tipo de contratista debe adjuntar seguridad social. */
  @Column({ name: 'requiere_seguridad_social', type: 'boolean', default: false })
  requiereSeguridadSocial: boolean;
}
