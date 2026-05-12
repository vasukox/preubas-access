import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { HseAutorizacion } from '../entities/hse-autorizacion.entity';

@Injectable()
export class AutorizacionRepository extends Repository<HseAutorizacion> {
  constructor(private dataSource: DataSource) {
    super(HseAutorizacion, dataSource.createEntityManager());
  }
}
