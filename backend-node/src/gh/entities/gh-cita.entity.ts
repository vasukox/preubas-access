import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { GhCandidato } from './gh-candidato.entity';
import { Sede } from '../../sede/entities/sede.entity';
import { Usuario } from '../../auth/entities/usuario.entity';
import { GhPortalToken } from './gh-portal-token.entity';
import { GhTipoCita, GhEstadoCita } from '../../common/enums/gh.enum';

@Entity('gh_citas')
export class GhCita extends BaseEntity {
  @Column({ type: 'varchar', length: 25, nullable: false, unique: true })
  codigo: string;

  @Column({ name: 'candidato_id', type: 'int', nullable: false })
  candidatoId: number;

  @Column({ name: 'sede_id', type: 'int', nullable: false })
  sedeId: number;

  @Column({ name: 'responsable_id', type: 'int', nullable: true })
  responsableId: number;

  @Column({ name: 'tipo_cita', type: 'enum', enum: GhTipoCita, nullable: false })
  tipoCita: GhTipoCita;

  @Column({ type: 'enum', enum: GhEstadoCita, default: GhEstadoCita.PROGRAMADA, nullable: false })
  estado: GhEstadoCita;

  @Column({ name: 'fecha_hora_inicio', type: 'datetime', nullable: false })
  fechaHoraInicio: Date;

  @Column({ name: 'fecha_hora_fin', type: 'datetime', nullable: false })
  fechaHoraFin: Date;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @ManyToOne(() => GhCandidato, (candidato) => candidato.citas, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'candidato_id' })
  candidato: GhCandidato;

  @ManyToOne(() => Sede, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sede_id' })
  sede: Sede;

  @ManyToOne(() => Usuario, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'responsable_id' })
  responsable: Usuario;

  @OneToMany(() => GhPortalToken, (token) => token.cita)
  tokensPortal: GhPortalToken[];
}
