import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { GhService } from './gh.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { RolNombre } from '../common/enums/rol.enum';

import { CrearCitaDto } from './dto/requests/crear-cita.dto';
import { CrearCitaGrupoDto } from './dto/requests/crear-cita-grupo.dto';
import { ActualizarCitaDto } from './dto/requests/actualizar-cita.dto';
import { CambiarEstadoCitaDto } from './dto/requests/cambiar-estado-cita.dto';
import { PortalConfirmarDto } from './dto/requests/portal-confirmar.dto';
import { PortalReagendarDto } from './dto/requests/portal-reagendar.dto';

import { CrearSesionInduccionDto } from './dto/requests/crear-sesion-induccion.dto';
import { EstadoSesionInduccionDto } from './dto/requests/estado-sesion-induccion.dto';
import { PortalInduccionCodigoDto } from './dto/requests/portal-induccion.dto';

import { CrearMaestroDotacionDto } from './dto/requests/crear-maestro-dotacion.dto';
import { CrearDotacionEntregaDto } from './dto/requests/crear-dotacion-entrega.dto';
import { AgregarDetalleEntregaDto } from './dto/requests/agregar-detalle-entrega.dto';
import { CrearImportacionDto } from './dto/requests/crear-importacion.dto';
import { VerificarVigilanteDto } from './dto/requests/verificar-vigilante.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('gh')
export class GhController {
  constructor(private readonly ghService: GhService) {}

  // ==========================================
  // CATÁLOGOS
  // ==========================================

  @Get('catalogos/tipos-cita')
  @Roles(RolNombre.ADMIN_GH, RolNombre.ADMIN_GLOBAL, RolNombre.VISUALIZADOR)
  async listTiposCita() {
    return this.ghService.listTiposCita();
  }

  @Get('catalogos/estados-cita')
  @Roles(RolNombre.ADMIN_GH, RolNombre.ADMIN_GLOBAL, RolNombre.VISUALIZADOR)
  async listEstadosCita() {
    return this.ghService.listEstadosCita();
  }

  // ==========================================
  // CITAS
  // ==========================================

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
    return this.ghService.getCitas(sedeId, estado, tipoCita, busqueda, fechaDesde, fechaHasta, p, pp);
  }

  @Get('citas/:id')
  @Roles(RolNombre.ADMIN_GH, RolNombre.ADMIN_GLOBAL, RolNombre.VISUALIZADOR)
  async getCita(@Param('id', ParseIntPipe) id: number) {
    return this.ghService.getCita(id);
  }

  @Post('citas')
  @Roles(RolNombre.ADMIN_GH, RolNombre.ADMIN_GLOBAL)
  async crearCita(@Body() body: CrearCitaDto, @Req() req: any) {
    return this.ghService.crearCita(body, req.user?.userId);
  }

  @Post('citas/grupo')
  @Roles(RolNombre.ADMIN_GH, RolNombre.ADMIN_GLOBAL)
  async crearCitasGrupo(@Body() body: CrearCitaGrupoDto, @Req() req: any) {
    return this.ghService.crearCitasGrupo(body, req.user?.userId);
  }

  @Put('citas/:id')
  @Roles(RolNombre.ADMIN_GH, RolNombre.ADMIN_GLOBAL)
  async actualizarCita(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ActualizarCitaDto,
    @Req() req: any,
  ) {
    return this.ghService.actualizarCita(id, body, req.user?.userId);
  }

  @Post('citas/:id/estado')
  @Roles(RolNombre.ADMIN_GH, RolNombre.ADMIN_GLOBAL)
  async cambiarEstadoPost(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CambiarEstadoCitaDto,
    @Req() req: any,
  ) {
    return this.ghService.cambiarEstado(id, body, req.user?.userId);
  }

  @Patch('citas/:id/estado')
  @Roles(RolNombre.ADMIN_GH, RolNombre.ADMIN_GLOBAL)
  async cambiarEstadoPatch(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CambiarEstadoCitaDto,
    @Req() req: any,
  ) {
    return this.ghService.cambiarEstado(id, body, req.user?.userId);
  }

  @Delete('citas/:id')
  @Roles(RolNombre.ADMIN_GH, RolNombre.ADMIN_GLOBAL)
  async eliminarCita(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    await this.ghService.eliminarCita(id, req.user?.userId);
    return { success: true };
  }

  // ==========================================
  // PORTALES PÚBLICOS — CITAS
  // ==========================================

  @Public()
  @Get('portal/:token')
  async validarTokenPortal(@Param('token') token: string) {
    return this.ghService.validarPortal(token);
  }

  @Public()
  @Post('portal/:token/confirmar')
  async portalConfirmar(
    @Param('token') token: string,
    @Body() body: PortalConfirmarDto,
  ) {
    return this.ghService.portalConfirmar(token, body);
  }

  @Public()
  @Post('portal/:token/reagendar')
  async portalReagendar(
    @Param('token') token: string,
    @Body() body: PortalReagendarDto,
  ) {
    return this.ghService.portalReagendar(token, body);
  }

  // ==========================================
  // PORTALES PÚBLICOS — INDUCCIÓN
  // ==========================================

  @Public()
  @Get('portal/induccion/:token')
  async validarTokenPortalInduccion(@Param('token') token: string) {
    return this.ghService.validarPortalInduccion(token);
  }

  @Public()
  @Post('portal/induccion/:token/checkin')
  async portalInduccionCheckin(
    @Param('token') token: string,
    @Body() body: PortalInduccionCodigoDto,
    @Req() req: any,
  ) {
    return this.ghService.portalInduccionCheckin(token, body, req.ip, req.headers['user-agent']);
  }

  @Public()
  @Post('portal/induccion/:token/checkout')
  async portalInduccionCheckout(
    @Param('token') token: string,
    @Body() body: PortalInduccionCodigoDto,
    @Req() req: any,
  ) {
    return this.ghService.portalInduccionCheckout(token, body, req.ip, req.headers['user-agent']);
  }

  // ==========================================
  // DASHBOARD
  // ==========================================

  @Get('dashboard/:sede_id')
  @Roles(RolNombre.ADMIN_GH, RolNombre.ADMIN_GLOBAL, RolNombre.VISUALIZADOR)
  async getDashboard(@Param('sede_id', ParseIntPipe) sedeId: number) {
    return this.ghService.getDashboard(sedeId);
  }

  // ==========================================
  // INDUCCIONES
  // ==========================================

  @Post('inducciones/sesiones')
  @Roles(RolNombre.ADMIN_GH, RolNombre.ADMIN_GLOBAL)
  async crearSesionInduccion(@Body() body: CrearSesionInduccionDto, @Req() req: any) {
    return this.ghService.crearSesionInduccion(body, req.user?.userId);
  }

  @Get('inducciones/sesiones')
  @Roles(RolNombre.ADMIN_GH, RolNombre.ADMIN_GLOBAL, RolNombre.VISUALIZADOR)
  async getInduccionesSesiones(
    @Query('sede_id') sedeId?: string,
    @Query('estado_sesion') estadoSesion?: string,
  ) {
    return this.ghService.getInduccionesSesiones(
      sedeId ? parseInt(sedeId, 10) : undefined,
      estadoSesion,
    );
  }

  @Get('inducciones/sesiones/:id')
  @Roles(RolNombre.ADMIN_GH, RolNombre.ADMIN_GLOBAL, RolNombre.VISUALIZADOR)
  async getSesionInduccion(@Param('id', ParseIntPipe) id: number) {
    return this.ghService.getSesionInduccion(id);
  }

  @Post('inducciones/sesiones/:id/estado')
  @Roles(RolNombre.ADMIN_GH, RolNombre.ADMIN_GLOBAL)
  async cambiarEstadoSesionInduccion(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: EstadoSesionInduccionDto,
    @Req() req: any,
  ) {
    return this.ghService.cambiarEstadoSesionInduccion(id, body, req.user?.userId);
  }

  @Post('inducciones/sesiones/:id/generar-codigo-checkin')
  @Roles(RolNombre.ADMIN_GH, RolNombre.ADMIN_GLOBAL)
  async generarCodigoCheckin(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.ghService.generarCodigoTemporalInduccion(id, 'CHECKIN', req.user?.userId);
  }

  @Post('inducciones/sesiones/:id/generar-codigo-checkout')
  @Roles(RolNombre.ADMIN_GH, RolNombre.ADMIN_GLOBAL)
  async generarCodigoCheckout(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.ghService.generarCodigoTemporalInduccion(id, 'CHECKOUT', req.user?.userId);
  }

  @Post('inducciones/sesiones/:id/enviar-links')
  @Roles(RolNombre.ADMIN_GH, RolNombre.ADMIN_GLOBAL)
  async enviarLinksInduccion(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.ghService.enviarLinksInduccion(id, req.user?.userId);
  }

  // ==========================================
  // VIGILANCIA
  // ==========================================

  @Post('vigilante/verificar')
  @Roles(RolNombre.ADMIN_GH, RolNombre.ADMIN_GLOBAL, RolNombre.VIGILANTE_HSE)
  async verificarVigilante(@Body() body: VerificarVigilanteDto, @Req() req: any) {
    return this.ghService.verificarVigilante(body, req.user?.userId);
  }

  // ==========================================
  // IMPORTACIONES
  // ==========================================

  @Post('importaciones')
  @Roles(RolNombre.ADMIN_GH, RolNombre.ADMIN_GLOBAL)
  async crearImportacion(@Body() body: CrearImportacionDto, @Req() req: any) {
    return this.ghService.crearImportacion(body, req.user?.userId);
  }

  @Get('importaciones/:id')
  @Roles(RolNombre.ADMIN_GH, RolNombre.ADMIN_GLOBAL, RolNombre.VISUALIZADOR)
  async getImportacion(@Param('id', ParseIntPipe) id: number) {
    return this.ghService.getImportacion(id);
  }

  // ==========================================
  // DOTACIÓN
  // ==========================================

  @Get('dotacion/maestro')
  @Roles(RolNombre.ADMIN_GH, RolNombre.ADMIN_GLOBAL, RolNombre.VISUALIZADOR)
  async getDotacionMaestro(
    @Query('sede_id') sedeId?: string,
    @Query('area') area?: string,
    @Query('cargo') cargo?: string,
    @Query('tipo_contrato') tipoContrato?: string,
    @Query('activos_only') activosOnly?: string,
  ) {
    return this.ghService.getDotacionMaestro(
      sedeId ? parseInt(sedeId, 10) : undefined,
      area,
      cargo,
      tipoContrato,
      activosOnly === 'true',
    );
  }

  @Post('dotacion/maestro')
  @Roles(RolNombre.ADMIN_GH, RolNombre.ADMIN_GLOBAL)
  async crearMaestroDotacion(@Body() body: CrearMaestroDotacionDto, @Req() req: any) {
    return this.ghService.crearMaestroDotacion(body, req.user?.userId);
  }

  @Get('dotacion/candidatos/buscar')
  @Roles(RolNombre.ADMIN_GH, RolNombre.ADMIN_GLOBAL, RolNombre.VISUALIZADOR)
  async buscarCandidatos(@Query('q') q?: string, @Query('sede_id') sedeId?: string) {
    return this.ghService.buscarCandidatos(q, sedeId ? parseInt(sedeId, 10) : undefined);
  }

  @Get('dotacion/entregas')
  @Roles(RolNombre.ADMIN_GH, RolNombre.ADMIN_GLOBAL, RolNombre.VISUALIZADOR)
  async getDotacionEntregas(@Query('estado') estado?: string, @Query('sede_id') sedeId?: string) {
    return this.ghService.getDotacionEntregas(sedeId ? parseInt(sedeId, 10) : undefined, estado);
  }

  @Post('dotacion/entregas')
  @Roles(RolNombre.ADMIN_GH, RolNombre.ADMIN_GLOBAL)
  async crearEntregaDotacion(@Body() body: CrearDotacionEntregaDto, @Req() req: any) {
    return this.ghService.crearEntregaDotacion(body, req.user?.userId);
  }

  @Post('dotacion/entregas/:id/detalle')
  @Roles(RolNombre.ADMIN_GH, RolNombre.ADMIN_GLOBAL)
  async agregarDetalleEntrega(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AgregarDetalleEntregaDto,
    @Req() req: any,
  ) {
    return this.ghService.agregarDetalleEntregaDotacion(id, body, req.user?.userId);
  }

  @Post('dotacion/entregas/:id/cerrar')
  @Roles(RolNombre.ADMIN_GH, RolNombre.ADMIN_GLOBAL)
  async cerrarEntrega(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.ghService.cerrarEntregaDotacion(id, req.user?.userId);
  }
}
