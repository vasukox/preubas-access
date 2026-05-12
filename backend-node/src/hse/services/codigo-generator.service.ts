import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HseAutorizacion } from '../entities/hse-autorizacion.entity';

@Injectable()
export class CodigoGeneratorService {
  constructor(
    @InjectRepository(HseAutorizacion)
    private readonly autorizacionRepo: Repository<HseAutorizacion>,
  ) {}

  async generarCodigo(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `HSE-${year}-`;

    const lastAutorizacion = await this.autorizacionRepo
      .createQueryBuilder('ha')
      .where('ha.codigo LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('ha.id', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (lastAutorizacion && lastAutorizacion.codigo) {
      const parts = lastAutorizacion.codigo.split('-');
      if (parts.length === 3) {
        const lastNumber = parseInt(parts[2], 10);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
    }

    const paddedNumber = nextNumber.toString().padStart(4, '0');
    return `${prefix}${paddedNumber}`;
  }
}
