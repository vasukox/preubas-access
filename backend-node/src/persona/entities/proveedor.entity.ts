import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Persona } from './persona.entity';

@Entity('proveedores')
export class Proveedor extends BaseEntity {
  @Column({
    name: 'nom_proveedor',
    type: 'varchar',
    length: 200,
    nullable: false,
  })
  nomProveedor: string;

  @Column({
    name: 'nit_proveedor',
    type: 'varchar',
    length: 20,
    unique: true,
    nullable: false,
  })
  nitProveedor: string;

  @Column({
    name: 'tipo_identificacion_prov',
    type: 'enum',
    enum: ['NIT', 'CC', 'CE', 'PASAPORTE'],
    nullable: true,
  })
  tipoIdentificacionProv: string;

  @Column({
    name: 'estado_prov',
    type: 'boolean',
    default: true,
    nullable: false,
  })
  estadoProv: boolean;

  @Column({
    name: 'direccion_prov',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  direccionProv: string;

  @Column({
    name: 'telefono_prov',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  telefonoProv: string;

  @Column({
    name: 'email_contacto',
    type: 'varchar',
    length: 150,
    nullable: true,
  })
  emailContacto: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  ciudad: string;

  @Column({
    name: 'tratamiento_datos',
    type: 'boolean',
    default: false,
    nullable: false,
  })
  tratamientoDatos: boolean;

  @Column({ type: 'text', nullable: true })
  notas: string;

  @OneToMany(() => Persona, (persona) => persona.proveedor)
  personas: Persona[];
}
