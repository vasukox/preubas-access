import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Persona } from '../../persona/entities/persona.entity';
import { Usuario } from '../../auth/entities/usuario.entity';
import { Sede } from '../../sede/entities/sede.entity';

// Schema Python: hse_excepciones — columnas reales de la BD
@Entity('hse_excepciones')
export class HseExcepcion extends BaseEntity {
  @Column({ name: 'persona_id', type: 'int', nullable: true })
  personaId: number | null;

  @Column({ name: 'tipo_documento', type: 'varchar', length: 20, nullable: true })
  tipoDocumento: string | null;

  @Column({ name: 'numero_documento', type: 'varchar', length: 30, nullable: true })
  numeroDocumento: string | null;

  @Column({ name: 'nombre_completo', type: 'varchar', length: 200, nullable: true })
  nombreCompleto: string | null;

  @Column({ name: 'proveedor_id', type: 'int', nullable: true })
  proveedorId: number | null;

  @Column({ name: 'origen_excepcion', type: 'varchar', length: 20, default: 'INDIVIDUAL' })
  origenExcepcion: string;

  @Column({ name: 'ubicacion_id', type: 'int', nullable: true })
  ubicacionId: number | null;

  @Column({ name: 'aprobado_por', type: 'int', nullable: false })
  aprobadoPor: number;

  @Column({ name: 'sede_id', type: 'int', nullable: false })
  sedeId: number;

  @Column({ name: 'motivo', type: 'text', nullable: false })
  motivo: string;

  @Column({ name: 'fecha_inicio', type: 'date', nullable: false })
  fechaInicio: Date;

  @Column({ name: 'fecha_fin', type: 'date', nullable: false })
  fechaFin: Date;

  @Column({ name: 'activa', type: 'boolean', default: true })
  activa: boolean;

  @ManyToOne(() => Persona, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'persona_id' })
  persona: Persona | null;

  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'aprobado_por' })
  aprobador: Usuario;

  @ManyToOne(() => Sede, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sede_id' })
  sede: Sede;
}
