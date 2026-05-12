import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Proveedor } from '../../persona/entities/proveedor.entity';
import { Sede } from '../../sede/entities/sede.entity';
import { Usuario } from '../../auth/entities/usuario.entity';
import { HseContratista } from './hse-contratista.entity';
import { TipoContratista, EstadoAutorizacion } from '../../common/enums/hse.enum';

@Entity('hse_autorizaciones')
export class HseAutorizacion extends BaseEntity {
  @Column({ type: 'varchar', length: 20, unique: true, nullable: false, comment: 'HSE-2026-XXXX — generado automáticamente' })
  codigo: string;

  @Column({ name: 'proveedor_id', type: 'int', nullable: true })
  proveedorId: number | null;

  @Column({ name: 'sede_id', type: 'int', nullable: false })
  sedeId: number;

  @Column({ name: 'creado_por', type: 'int', nullable: false })
  creadoPor: number;

  @Column({ name: 'responsable_interno_id', type: 'int', nullable: true })
  responsableInternoId: number;

  @Column({ name: 'tipo_contratista', type: 'enum', enum: TipoContratista, nullable: false })
  tipoContratista: TipoContratista;

  @Column({ name: 'descripcion_actividad', type: 'text', nullable: false })
  descripcionActividad: string;

  @Column({ name: 'fecha_inicio', type: 'date', nullable: false })
  fechaInicio: Date;

  @Column({ name: 'fecha_fin', type: 'date', nullable: false })
  fechaFin: Date;

  @Column({ type: 'enum', enum: EstadoAutorizacion, default: EstadoAutorizacion.BORRADOR, nullable: false })
  estado: EstadoAutorizacion;

  @Column({ name: 'motivo_denegacion', type: 'text', nullable: true })
  motivoDenegacion: string | null;

  // ── Relaciones ──────────────────────────────────────────────────

  @ManyToOne(() => Proveedor, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'proveedor_id' })
  proveedor: Proveedor;

  @ManyToOne(() => Sede, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sede_id' })
  sede: Sede;

  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'creado_por' })
  creador: Usuario;

  @ManyToOne(() => Usuario, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'responsable_interno_id' })
  responsableInterno: Usuario;

  @OneToMany(() => HseContratista, (contratista) => contratista.autorizacion, { cascade: true })
  contratistas: HseContratista[];
}
