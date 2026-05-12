import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { HseExcepcion } from '../entities/hse-excepcion.entity';

@Injectable()
export class ExcepcionRepository extends Repository<HseExcepcion> {
  constructor(private dataSource: DataSource) {
    super(HseExcepcion, dataSource.createEntityManager());
  }
}
