import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { HseContratista } from './hse-contratista.entity';

@Entity('hse_certificaciones')
export class HseCertificaciones extends BaseEntity {
  @Column({ name: 'contratista_id', type: 'int', unique: true })
  contratistaId: number;

  @Column({ name: 'url_certificado_alturas', type: 'text', nullable: true })
  urlCertificadoAlturas: string;

  @Column({ name: 'fecha_vencimiento_alturas', type: 'date', nullable: true })
  fechaVencimientoAlturas: Date;

  @Column({ name: 'url_certificado_confinados', type: 'text', nullable: true })
  urlCertificadoConfinados: string;

  @Column({ name: 'fecha_vencimiento_confinados', type: 'date', nullable: true })
  fechaVencimientoConfinados: Date;

  @Column({ name: 'url_licencia_sst', type: 'text', nullable: true })
  urlLicenciaSst: string;

  @Column({ name: 'url_otros_certificados', type: 'text', nullable: true })
  urlOtrosCertificados: string;

  @OneToOne(() => HseContratista, (contratista) => contratista.certificaciones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contratista_id' })
  contratista: HseContratista;
}
