import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { HseSegSocial } from './hse-seg-social.entity';

@Entity('cat_eps')
export class CatEps extends BaseEntity {
  @Column({ type: 'varchar', length: 150, nullable: false })
  nombre: string;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: false })
  codigo: string;

  @Column({ type: 'boolean', default: true, nullable: false })
  activa: boolean;

  @OneToMany(() => HseSegSocial, (segSocial) => segSocial.eps)
  seguridadSocial: HseSegSocial[];
}
