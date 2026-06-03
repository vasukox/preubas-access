import {
  Controller,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { NotificacionesService } from './notificaciones.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  @Get()
  async listar(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;
    return this.notificacionesService.listar(req.user.id, p, l);
  }

  @Get('conteo')
  async conteo(@Request() req: any) {
    return this.notificacionesService.conteo(req.user.id);
  }

  @Patch(':id/leer')
  async marcarLeida(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.notificacionesService.marcarLeida(id, req.user.id);
  }

  @Patch('leer-todas')
  async marcarTodasLeidas(@Request() req: any) {
    return this.notificacionesService.marcarTodasLeidas(req.user.id);
  }
}
