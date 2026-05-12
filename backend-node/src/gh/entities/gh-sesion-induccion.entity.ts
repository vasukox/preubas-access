import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Sede } from '../../sede/entities/sede.entity';
import { Usuario } from '../../auth/entities/usuario.entity';
import { GhInduccionAsistencia } from './gh-induccion-asistencia.entity';
import { GhEstadoSesionInduccion, GhTipoSesion } from '../../common/enums/gh.enum';

@Entity('gh_sesiones_induccion')
export class GhSesionInduccion extends BaseEntity {
  @Column({ name: 'sede_id', type: 'int', nullable: false })
  sedeId: number;

  @Column({ type: 'varchar', length: 120, nullable: false })
  area: string;

  @Column({ name: 'tipo_induccion', type: 'varchar', length: 120, nullable: false })
  tipoInduccion: string;

  @Column({ name: 'tipo_sesion', type: 'enum', enum: GhTipoSesion, default: GhTipoSesion.PRESENCIAL, nullable: false })
  tipoSesion: GhTipoSesion;

  @Column({ name: 'link_virtual', type: 'text', nullable: true })
  linkVirtual: string;

  @Column({ name: 'sala_fisica', type: 'varchar', length: 120, nullable: true })
  salaFisica: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ name: 'capacidad_maxima', type: 'int', nullable: true })
  capacidadMaxima: number;

  @Column({ name: 'responsable_usuario_id', type: 'int', nullable: true })
  responsableUsuarioId: number;

  @Column({ name: 'fecha_hora_inicio', type: 'datetime', nullable: false })
  fechaHoraInicio: Date;

  @Column({ name: 'fecha_hora_fin', type: 'datetime', nullable: false })
  fechaHoraFin: Date;

  @Column({ name: 'estado_sesion', type: 'enum', enum: GhEstadoSesionInduccion, default: GhEstadoSesionInduccion.PROGRAMADA, nullable: false })
  estadoSesion: GhEstadoSesionInduccion;

  @Column({ name: 'codigo_checkin_actual', type: 'varchar', length: 10, nullable: true })
  codigoCheckinActual: string;

  @Column({ name: 'codigo_checkout_actual', type: 'varchar', length: 10, nullable: true })
  codigoCheckoutActual: string;

  @Column({ name: 'fecha_cierre', type: 'datetime', nullable: true })
  fechaCierre: Date;

  @ManyToOne(() => Sede, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sede_id' })
  sede: Sede;

  @ManyToOne(() => Usuario, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'responsable_usuario_id' })
  responsable: Usuario;

  @OneToMany(() => GhInduccionAsistencia, (asistencia) => asistencia.sesion, { cascade: true })
  asistentes: GhInduccionAsistencia[];
}
