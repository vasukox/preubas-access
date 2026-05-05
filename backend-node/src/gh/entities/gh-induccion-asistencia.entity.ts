import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { GhSesionInduccion } from './gh-sesion-induccion.entity';
import { GhCandidato } from './gh-candidato.entity';
import { GhEstadoAsistenciaInduccion } from '../../common/enums/gh.enum';

@Entity('gh_induccion_asistencias')
export class GhInduccionAsistencia extends BaseEntity {
  @Column({ name: 'sesion_id', type: 'int', nullable: false })
  sesionId: number;

  @Column({ name: 'candidato_id', type: 'int', nullable: false })
  candidatoId: number;

  @Column({ name: 'token_autogestion', type: 'varchar', length: 96, nullable: false, unique: true })
  tokenAutogestion: string;

  @Column({ name: 'estado_asistencia', type: 'enum', enum: GhEstadoAsistenciaInduccion, default: GhEstadoAsistenciaInduccion.PENDIENTE, nullable: false })
  estadoAsistencia: GhEstadoAsistenciaInduccion;

  @Column({ name: 'checkin_at', type: 'datetime', nullable: true })
  checkinAt: Date;

  @Column({ name: 'checkout_at', type: 'datetime', nullable: true })
  checkoutAt: Date;

  @Column({ name: 'intentos_codigo', type: 'int', default: 0, nullable: false })
  intentosCodigo: number;

  @Column({ name: 'ultimo_error_codigo', type: 'varchar', length: 200, nullable: true })
  ultimoErrorCodigo: string;

  @Column({ name: 'ip_entrada', type: 'varchar', length: 80, nullable: true })
  ipEntrada: string;

  @Column({ name: 'user_agent_entrada', type: 'text', nullable: true })
  userAgentEntrada: string;

  @Column({ name: 'ip_salida', type: 'varchar', length: 80, nullable: true })
  ipSalida: string;

  @Column({ name: 'user_agent_salida', type: 'text', nullable: true })
  userAgentSalida: string;

  @ManyToOne(() => GhSesionInduccion, (sesion) => sesion.asistentes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sesion_id' })
  sesion: GhSesionInduccion;

  @ManyToOne(() => GhCandidato, (candidato) => candidato.asistenciasInduccion, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'candidato_id' })
  candidato: GhCandidato;
}
