import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { TokenValidatorService } from '../../hse/services/token-validator.service';

@Injectable()
export class AutogestionTokenGuard implements CanActivate {
  constructor(private tokenValidator: TokenValidatorService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.params.token || request.body.token || request.query.token;

    if (!token) {
      throw new UnauthorizedException('Token de autogestion requerido');
    }

    try {
      const contratista = await this.tokenValidator.validarToken(token);
      request.contratista = contratista;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof NotFoundException) {
        throw new UnauthorizedException('Token de autogestion invalido o vencido');
      }
      throw new InternalServerErrorException('Error interno al validar el token de autogestion');
    }
  }
}
