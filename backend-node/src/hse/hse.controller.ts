import { Controller, Get, Query, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { HseService } from './hse.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolNombre } from '../common/enums/rol.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hse')
export class HseController {
  constructor(private readonly hseService: HseService) {}

  @Get('catalogos/sedes')
  async getSedes(@Request() req: any) {
    return this.hseService.getCatalogosSedes(req.user);
  }

  @Get('catalogos/eps')
  async getEps() {
    return this.hseService.getCatalogosEps();
  }

  @Get('catalogos/proveedores')
  async getProveedores() {
    // Retornamos array vacío para evitar 404 mientras se implementa el módulo de Proveedores
    return [];
  }

  @Get('autorizaciones')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE, RolNombre.VISUALIZADOR)
  async getAutorizaciones(
    @Query('sede_id', ParseIntPipe) sedeId: number,
    @Query('estado') estado?: string,
    @Query('page') page?: string,
    @Query('per_page') perPage?: string,
  ) {
    try {
      const p = page ? parseInt(page, 10) : 1;
      const pp = perPage ? parseInt(perPage, 10) : 20;
      const result = await this.hseService.getAutorizaciones(sedeId, estado, p, pp);
      return result.items; 
    } catch (e: any) {
      throw new (require('@nestjs/common')).HttpException({ error: e.message, stack: e.stack }, 500);
    }
  }

  @Get('dashboard/:sedeId')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE, RolNombre.VISUALIZADOR)
  async getDashboard(@Param('sedeId', ParseIntPipe) sedeId: number) {
    return this.hseService.getDashboard(sedeId);
  }
}
