import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Proveedor } from './proveedor.entity';

@Entity('personas')
export class Persona extends BaseEntity {
  @Column({ name: 'tipo_documento', type: 'enum', enum: ['CC', 'CE', 'PASAPORTE', 'TI', 'NIT'], nullable: false })
  tipoDocumento: string;

  @Column({ name: 'numero_documento', type: 'varchar', length: 30, nullable: false })
  numeroDocumento: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  nombres: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  apellidos: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email: string;

  @Column({ name: 'telefono_celular', type: 'varchar', length: 20, nullable: true })
  telefonoCelular: string;

  @Column({ name: 'ciudad_operacion', type: 'varchar', length: 80, nullable: true })
  ciudadOperacion: string;

  @Column({ name: 'direccion_domicilio', type: 'varchar', length: 200, nullable: true })
  direccionDomicilio: string;

  @Column({ name: 'es_extranjero', type: 'boolean', default: false, nullable: false })
  esExtranjero: boolean;

  @Column({ name: 'fecha_nacimiento', type: 'date', nullable: true })
  fechaNacimiento: Date;

  @Column({ name: 'tratamiento_datos', type: 'boolean', default: false, nullable: false })
  tratamientoDatos: boolean;

  @Column({ name: 'proveedor_id', type: 'int', nullable: true })
  proveedorId: number;

  @Column({ name: 'tipologia_hse', type: 'enum', enum: ['CONTRATISTA_EMPRESA', 'TECNICO_INDEPENDIENTE', 'PROVEEDOR_SERVICIOS', 'INSPECTOR_AUDITOR', 'FUNCIONARIO_PUBLICO'], nullable: true })
  tipologiaHse: string;

  @Column({ type: 'boolean', default: true, nullable: false })
  activo: boolean;

  @Column({ type: 'text', nullable: true })
  notas: string;

  @ManyToOne(() => Proveedor, (prov) => prov.personas, { nullable: true })
  @JoinColumn({ name: 'proveedor_id' })
  proveedor: Proveedor;
}