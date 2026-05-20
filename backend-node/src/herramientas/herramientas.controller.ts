import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query, ParseIntPipe, DefaultValuePipe, Req } from '@nestjs/common';
import { Request } from 'express';
import { HerramientasService } from './herramientas.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolNombre } from '../common/enums/rol.enum';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UpdatePermisosDto } from './dto/update-permisos.dto';
import { AsignarRolDto } from './dto/asignar-rol.dto';

@Controller('herramientas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolNombre.ADMIN_GLOBAL)
export class HerramientasController {
  constructor(private readonly herramientasService: HerramientasService) {}

  @Get('roles')
  async listarRoles() {
    return this.herramientasService.listarRoles();
  }

  @Get('usuarios')
  async listarUsuarios() {
    return this.herramientasService.listarUsuarios();
  }

  @Post('usuarios')
  async crearUsuario(
    @Body() dto: CreateUsuarioDto,
    @Req() req: Request & { user: { id: number; email: string; nombreCompleto?: string } },
  ) {
    const currentUserName = req.user.nombreCompleto || req.user.email;
    const usuarioCreado = await this.herramientasService.crearUsuario(dto, req.user.id, currentUserName);
    
    // El frontend espera { success: true, data: usuario } gracias al interceptor
    return usuarioCreado;
  }

  @Put('usuarios/:id')
  async actualizarUsuario(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUsuarioDto,
    @Req() req: Request & { user: { id: number; email: string; nombreCompleto?: string } },
  ) {
    const currentUserName = req.user.nombreCompleto || req.user.email;
    return this.herramientasService.actualizarUsuario(id, dto, req.user.id, currentUserName);
  }

  @Delete('usuarios/:id')
  async eliminarUsuario(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: { id: number; email: string; nombreCompleto?: string } },
  ) {
    const currentUserName = req.user.nombreCompleto || req.user.email;
    await this.herramientasService.eliminarUsuario(id, req.user.id, currentUserName);
    return { message: 'Usuario eliminado correctamente' };
  }

  @Get('auditoria')
  async listarAuditoria(
    @Query('limite', new DefaultValuePipe(100), ParseIntPipe) limite: number,
  ) {
    return this.herramientasService.listarAuditoria(limite);
  }

  @Put('usuarios/:id/permisos')
  async actualizarPermisos(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePermisosDto,
    @Req() req: Request & { user: { id: number; email: string; nombreCompleto?: string } },
  ) {
    const currentUserName = req.user.nombreCompleto || req.user.email;
    return this.herramientasService.actualizarPermisos(id, dto, req.user.id, currentUserName);
  }

  @Post('usuarios/:id/roles')
  async asignarRol(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AsignarRolDto,
    @Req() req: Request & { user: { id: number; email: string; nombreCompleto?: string } },
  ) {
    const currentUserName = req.user.nombreCompleto || req.user.email;
    return this.herramientasService.asignarRol(
      id,
      dto.rolNombre,
      req.user.id,
      currentUserName,
      dto.sedeAsignadaId,
      dto.sedesAsignadasIds,
    );
  }

  @Delete('usuarios/:id/roles/:rolNombre')
  async quitarRol(
    @Param('id', ParseIntPipe) id: number,
    @Param('rolNombre') rolNombre: string,
    @Req() req: Request & { user: { id: number; email: string; nombreCompleto?: string } },
  ) {
    const currentUserName = req.user.nombreCompleto || req.user.email;
    return this.herramientasService.quitarRol(id, rolNombre, req.user.id, currentUserName);
  }
}
