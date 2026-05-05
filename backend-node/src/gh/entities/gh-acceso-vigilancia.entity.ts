import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { GhCita } from './gh-cita.entity';
import { Sede } from '../../sede/entities/sede.entity';
import { Usuario } from '../../auth/entities/usuario.entity';
import { GhTipoAcceso } from '../../common/enums/gh.enum';

@Entity('gh_accesos_vigilancia')
export class GhAccesoVigilancia extends BaseEntity {
  @Column({ name: 'cita_id', type: 'int', nullable: false })
  citaId: number;

  @Column({ name: 'sede_id', type: 'int', nullable: false })
  sedeId: number;

  @Column({ name: 'vigilante_id', type: 'int', nullable: true })
  vigilanteId: number;

  @Column({ name: 'tipo_acceso', type: 'enum', enum: GhTipoAcceso, nullable: false })
  tipoAcceso: GhTipoAcceso;

  @Column({ type: 'varchar', length: 30, nullable: false, default: 'MANUAL' })
  metodo: string;

  @Column({ type: 'text', nullable: true })
  notas: string;

  @ManyToOne(() => GhCita, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cita_id' })
  cita: GhCita;

  @ManyToOne(() => Sede, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sede_id' })
  sede: Sede;

  @ManyToOne(() => Usuario, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'vigilante_id' })
  vigilante: Usuario;
}
