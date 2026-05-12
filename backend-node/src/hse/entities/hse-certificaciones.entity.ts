import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { HseContratista } from './hse-contratista.entity';
import { PermisoTipo } from '../../common/enums/hse.enum';

@Entity('hse_certificaciones')
export class HseCertificaciones extends BaseEntity {
  @Column({ name: 'contratista_id', type: 'int', unique: true })
  contratistaId: number;

  @Column({ name: 'art_descripcion_tarea', type: 'text', nullable: true })
  artDescripcionTarea: string;

  @Column({ name: 'art_archivo', type: 'varchar', length: 500, nullable: true })
  artArchivo: string;

  @Column({ name: 'permiso_tipo', type: 'enum', enum: PermisoTipo, nullable: true })
  permisoTipo: PermisoTipo;

  @Column({ name: 'permiso_fecha', type: 'date', nullable: true })
  permisoFecha: Date;

  @Column({ name: 'permiso_archivo', type: 'varchar', length: 500, nullable: true })
  permisoArchivo: string;

  @OneToOne(() => HseContratista, (contratista) => contratista.certificaciones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contratista_id' })
  contratista: HseContratista;
}
