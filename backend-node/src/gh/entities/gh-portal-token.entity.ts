import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { GhCita } from './gh-cita.entity';

@Entity('gh_portal_tokens')
export class GhPortalToken extends BaseEntity {
  @Column({ name: 'cita_id', type: 'int', nullable: false })
  citaId: number;

  @Column({ type: 'varchar', length: 64, nullable: false, unique: true })
  token: string;

  @Column({ name: 'expira_en', type: 'datetime', nullable: false })
  expiraEn: Date;

  @Column({ name: 'usado_en', type: 'datetime', nullable: true })
  usadoEn: Date;

  @ManyToOne(() => GhCita, (cita) => cita.tokensPortal, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cita_id' })
  cita: GhCita;
}
