import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Ubicacion } from './ubicacion.entity';

/**
 * Instalación física de Permoda S.A.S.
 *
 * Equivalente a `class Sede(BaseModel)` en Python (app/models/sede.py).
 * Tabla: sedes
 */
@Entity('sedes')
export class Sede extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true, nullable: false })
  nombre: string;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: false })
  codigo: string;

  @Column({ type: 'varchar', length: 80, default: 'Bogotá', nullable: false })
  ciudad: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  direccion: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono: string;

  @Column({ type: 'boolean', default: true, nullable: false })
  activa: boolean;

  @Column({
    name: 'capacidad_carros',
    type: 'int',
    default: 0,
    nullable: false,
  })
  capacidadCarros: number;

  @Column({
    name: 'capacidad_motos',
    type: 'int',
    default: 0,
    nullable: false,
  })
  capacidadMotos: number;

  @Column({
    name: 'capacidad_bicis',
    type: 'int',
    default: 0,
    nullable: false,
  })
  capacidadBicis: number;

  @Column({
    name: 'aplica_pico_placa',
    type: 'boolean',
    default: false,
    nullable: false,
  })
  aplicaPicoPlaca: boolean;

  @Column({ type: 'text', nullable: true })
  notas: string;

  @OneToMany(() => Ubicacion, (ubicacion) => ubicacion.sede, {
    cascade: true,
  })
  ubicaciones: Ubicacion[];
}
