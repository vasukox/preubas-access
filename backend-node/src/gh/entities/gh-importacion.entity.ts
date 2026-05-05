import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Sede } from '../../sede/entities/sede.entity';
import { Usuario } from '../../auth/entities/usuario.entity';
import { GhImportacionDetalle } from './gh-importacion-detalle.entity';
import { GhImportacionEstado } from '../../common/enums/gh.enum';

@Entity('gh_importaciones')
export class GhImportacion extends BaseEntity {
  @Column({ name: 'sede_id', type: 'int', nullable: false })
  sedeId: number;

  @Column({ name: 'creado_por', type: 'int', nullable: false })
  creadoPor: number;

  @Column({ name: 'nombre_archivo', type: 'varchar', length: 255, nullable: false })
  nombreArchivo: string;

  @Column({ type: 'enum', enum: GhImportacionEstado, default: GhImportacionEstado.PENDIENTE, nullable: false })
  estado: GhImportacionEstado;

  @Column({ name: 'filas_totales', type: 'int', default: 0, nullable: false })
  filasTotales: number;

  @Column({ name: 'filas_exitosas', type: 'int', default: 0, nullable: false })
  filasExitosas: number;

  @Column({ name: 'filas_fallidas', type: 'int', default: 0, nullable: false })
  filasFallidas: number;

  @Column({ name: 'resumen_error', type: 'text', nullable: true })
  resumenError: string;

  @ManyToOne(() => Sede, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sede_id' })
  sede: Sede;

  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'creado_por' })
  creador: Usuario;

  @OneToMany(() => GhImportacionDetalle, (detalle) => detalle.importacion, { cascade: true })
  detalles: GhImportacionDetalle[];
}
