import { Controller, Get, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { GhService } from './gh.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolNombre } from '../common/enums/rol.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('gh')
export class GhController {
  constructor(private readonly ghService: GhService) {}

  @Get('citas')
  @Roles(RolNombre.ADMIN_GH, RolNombre.ADMIN_GLOBAL, RolNombre.VISUALIZADOR)
  async getCitas(
    @Query('sede_id', ParseIntPipe) sedeId: number,
    @Query('estado') estado?: string,
    @Query('tipo_cita') tipoCita?: string,
    @Query('busqueda') busqueda?: string,
    @Query('fecha_desde') fechaDesde?: string,
    @Query('fecha_hasta') fechaHasta?: string,
    @Query('page') page?: string,
    @Query('per_page') perPage?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const pp = perPage ? parseInt(perPage, 10) : 20;
    return this.ghService.getCitas(
      sedeId, 
      estado, 
      tipoCita, 
      busqueda, 
      fechaDesde, 
      fechaHasta, 
      p, 
      pp
    );
  }
}
