import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { GhCita } from './gh-cita.entity';
import { GhInduccionAsistencia } from './gh-induccion-asistencia.entity';
import { GhDotacionEntrega } from './gh-dotacion-entrega.entity';

@Entity('gh_candidatos')
export class GhCandidato extends BaseEntity {
  @Column({ name: 'tipo_documento', type: 'varchar', length: 20, nullable: false })
  tipoDocumento: string;

  @Column({ name: 'numero_documento', type: 'varchar', length: 30, nullable: false, unique: true })
  numeroDocumento: string;

  @Column({ type: 'varchar', length: 120, nullable: false })
  nombres: string;

  @Column({ type: 'varchar', length: 120, nullable: false })
  apellidos: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  telefono: string;

  @OneToMany(() => GhCita, (cita) => cita.candidato)
  citas: GhCita[];

  @OneToMany(() => GhInduccionAsistencia, (asistencia) => asistencia.candidato)
  asistenciasInduccion: GhInduccionAsistencia[];

  @OneToMany(() => GhDotacionEntrega, (entrega) => entrega.candidato)
  dotacionEntregas: GhDotacionEntrega[];
}
