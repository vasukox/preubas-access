import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HseContratista } from '../entities/hse-contratista.entity';

@Injectable()
export class TokenValidatorService {
  constructor(
    @InjectRepository(HseContratista)
    private readonly contratistaRepo: Repository<HseContratista>,
  ) {}

  async validarToken(token: string): Promise<HseContratista> {
    if (!token) {
      throw new UnauthorizedException('Token de autogestión requerido');
    }

    const contratista = await this.contratistaRepo.findOne({
      where: { tokenAutogestion: token },
      relations: ['autorizacion', 'autorizacion.sede'],
    });

    if (!contratista) {
      throw new NotFoundException('Token de autogestión inválido o no encontrado');
    }

    if (contratista.tokenExpiraEn && new Date() > contratista.tokenExpiraEn) {
      throw new UnauthorizedException('El token de autogestión ha expirado');
    }

    return contratista;
  }
}
