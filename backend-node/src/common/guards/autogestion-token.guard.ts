import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { TokenValidatorService } from '../../hse/services/token-validator.service';

@Injectable()
export class AutogestionTokenGuard implements CanActivate {
  constructor(private tokenValidator: TokenValidatorService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.params.token || request.body.token || request.query.token;
    
    if (!token) {
      return false;
    }

    try {
      const contratista = await this.tokenValidator.validarToken(token);
      // Adjuntar el contratista a la request para uso posterior
      request.contratista = contratista;
      return true;
    } catch (e) {
      return false;
    }
  }
}
