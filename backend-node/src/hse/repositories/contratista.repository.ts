import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { HseContratista } from '../entities/hse-contratista.entity';

@Injectable()
export class ContratistaRepository extends Repository<HseContratista> {
  constructor(private dataSource: DataSource) {
    super(HseContratista, dataSource.createEntityManager());
  }
}
