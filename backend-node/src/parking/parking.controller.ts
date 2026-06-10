import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param, Query,
  ParseIntPipe, UseGuards, Request,
} from '@nestjs/common'
import { JwtAuthGuard }  from '../common/guards/jwt-auth.guard'
import { RolesGuard }    from '../common/guards/roles.guard'
import { Roles }         from '../common/decorators/roles.decorator'
import { Public }        from '../common/decorators/public.decorator'
import { RolNombre }     from '../common/enums/rol.enum'

import { ParkingTokenGuard }    from './guards/parking-token.guard'
import { DashboardParkingService } from './services/dashboard.service'
import { CatalogosService }     from './services/catalogos.service'
import { SolicitudesService }   from './services/solicitudes.service'
import { AutorizacionesService } from './services/autorizaciones.service'
import { VehiculosService }     from './services/vehiculos.service'
import { ZonasService }         from './services/zonas.service'
import { VigilanteService }     from './services/vigilante.service'
import { NovedadesService }     from './services/novedades.service'
import { ExcepcionesService }   from './services/excepciones.service'
import { AccesosService }       from './services/accesos.service'
import { ReportesService }      from './services/reportes.service'
import { ConfiguracionService } from './services/configuracion.service'

import {
  CreateSolicitudDto, UpdateSolicitudDto, AprobarSolicitudDto,
  DenegarSolicitudDto, SolicitarCorreccionDto, SuspenderSolicitudDto,
  RegenerarTokenDto, ListarSolicitudesDto, CompletarAutogestionDto,
} from './dto/solicitud.dto'
import { CreateZonaDto, UpdateZonaDto, CreateCupoDto, CambiarEstadoCupoDto, ListarCuposDto } from './dto/zona.dto'
import { VerificarPlacaDto, RegistrarEntradaDto, RegistrarSalidaDto } from './dto/vigilante.dto'
import { CreateNovedadDto, UpdateNovedadDto, EscalarNovedadDto, CerrarNovedadDto, AnularNovedadDto } from './dto/novedad.dto'
import { CreateExcepcionDto, CreateExcepcionLoteDto, AnularExcepcionDto } from './dto/excepcion.dto'
import { UpdatePoliticaDto } from './dto/configuracion.dto'

const ROLES_ADMIN    = [RolNombre.ADMIN_GLOBAL, RolNombre.ADMIN_PARKING]
const ROLES_GESTION  = [...ROLES_ADMIN, RolNombre.GESTION_PARKING]
const ROLES_VIGILANTE = [...ROLES_GESTION, RolNombre.VIGILANTE_PARKING]
const ROLES_VISUALIZADOR = [...ROLES_GESTION, RolNombre.VISUALIZADOR]
const ROLES_ALL = [...ROLES_VIGILANTE, RolNombre.VISUALIZADOR]

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('parking')
export class ParkingController {
  constructor(
    private readonly dashboardService:    DashboardParkingService,
    private readonly catalogosService:    CatalogosService,
    private readonly solicitudesService:  SolicitudesService,
    private readonly autorizacionesService: AutorizacionesService,
    private readonly vehiculosService:    VehiculosService,
    private readonly zonasService:        ZonasService,
    private readonly vigilanteService:    VigilanteService,
    private readonly novedadesService:    NovedadesService,
    private readonly excepcionesService:  ExcepcionesService,
    private readonly accesosService:      AccesosService,
    private readonly reportesService:     ReportesService,
    private readonly configuracionService: ConfiguracionService,
  ) {}

  // ── Dashboard ────────────────────────────────────────────────────

  @Get('dashboard/:sedeId')
  @Roles(...ROLES_ALL)
  getDashboard(@Param('sedeId', ParseIntPipe) sedeId: number) {
    return this.dashboardService.getDashboard(sedeId)
  }

  // ── Catálogos (públicos) ─────────────────────────────────────────

  @Public()
  @Get('catalogos/sedes')
  getSedes() { return this.catalogosService.getSedes() }

  @Public()
  @Get('catalogos/tipos-vehiculo')
  getTiposVehiculo() { return this.catalogosService.getTiposVehiculo() }

  @Public()
  @Get('catalogos/tipos-usuario')
  getTiposUsuario() { return this.catalogosService.getTiposUsuario() }

  @Public()
  @Get('catalogos/zonas/:sedeId')
  getZonasCatalogo(@Param('sedeId', ParseIntPipe) sedeId: number) {
    return this.catalogosService.getZonasPorSede(sedeId)
  }

  @Public()
  @Get('catalogos/politicas/:sedeId')
  getPoliticaCatalogo(@Param('sedeId', ParseIntPipe) sedeId: number) {
    return this.catalogosService.getPoliticaSede(sedeId)
  }

  // ── Solicitudes ──────────────────────────────────────────────────

  @Get('solicitudes')
  @Roles(...ROLES_GESTION)
  getSolicitudes(@Query() query: ListarSolicitudesDto) {
    return this.solicitudesService.findAll(query)
  }

  @Get('solicitudes/:id')
  @Roles(...ROLES_GESTION)
  getSolicitud(@Param('id', ParseIntPipe) id: number) {
    return this.solicitudesService.findOne(id)
  }

  @Post('solicitudes')
  @Roles(...ROLES_GESTION)
  createSolicitud(@Body() dto: CreateSolicitudDto, @Request() req: any) {
    return this.solicitudesService.create(dto, req.user.id)
  }

  @Put('solicitudes/:id')
  @Roles(...ROLES_GESTION)
  updateSolicitud(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSolicitudDto,
    @Request() req: any,
  ) {
    return this.solicitudesService.update(id, dto, req.user.id)
  }

  @Delete('solicitudes/:id')
  @Roles(...ROLES_GESTION)
  deleteSolicitud(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.solicitudesService.remove(id, req.user.id)
  }

  @Post('solicitudes/:id/enviar')
  @Roles(...ROLES_GESTION)
  enviarSolicitud(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.solicitudesService.enviar(id, req.user.id)
  }

  @Post('solicitudes/:id/token')
  @Roles(...ROLES_GESTION)
  regenerarToken(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegenerarTokenDto,
    @Request() req: any,
  ) {
    return this.solicitudesService.regenerarToken(id, dto, req.user.id)
  }

  @Post('solicitudes/:id/tomar')
  @Roles(...ROLES_GESTION)
  tomarSolicitud(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.solicitudesService.tomar(id, req.user.id)
  }

  @Post('solicitudes/:id/aprobar')
  @Roles(...ROLES_GESTION)
  aprobarSolicitud(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AprobarSolicitudDto,
    @Request() req: any,
  ) {
    return this.solicitudesService.aprobar(id, dto, req.user.id)
  }

  @Post('solicitudes/:id/denegar')
  @Roles(...ROLES_GESTION)
  denegarSolicitud(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DenegarSolicitudDto,
    @Request() req: any,
  ) {
    return this.solicitudesService.denegar(id, dto, req.user.id)
  }

  @Post('solicitudes/:id/solicitar-correccion')
  @Roles(...ROLES_GESTION)
  solicitarCorreccion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SolicitarCorreccionDto,
    @Request() req: any,
  ) {
    return this.solicitudesService.solicitarCorreccion(id, dto, req.user.id)
  }

  @Post('solicitudes/:id/suspender')
  @Roles(...ROLES_GESTION)
  suspenderSolicitud(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SuspenderSolicitudDto,
    @Request() req: any,
  ) {
    return this.solicitudesService.suspender(id, dto, req.user.id)
  }

  @Post('solicitudes/:id/revocar')
  @Roles(...ROLES_GESTION)
  revocarSolicitud(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SuspenderSolicitudDto,
    @Request() req: any,
  ) {
    return this.solicitudesService.revocar(id, dto, req.user.id)
  }

  // ── Autogestión (token público) ──────────────────────────────────

  @Public()
  @UseGuards(ParkingTokenGuard)
  @Get('autogestion/:token')
  getAutogestion(@Request() req: any) {
    return this.solicitudesService.iniciarAutogestion(req.parkingSolicitud.id)
  }

  @Public()
  @UseGuards(ParkingTokenGuard)
  @Post('autogestion/:token/completar')
  completarAutogestion(@Request() req: any, @Body() dto: CompletarAutogestionDto) {
    return this.solicitudesService.completarAutogestion(req.parkingSolicitud.id, dto)
  }

  // ── Vehículos ────────────────────────────────────────────────────

  @Get('vehiculos')
  @Roles(...ROLES_VISUALIZADOR)
  getVehiculos(
    @Query('sede_id') sede_id?: string,
    @Query('tipo_vehiculo') tipo_vehiculo?: string,
    @Query('activo') activo?: string,
    @Query('placa') placa?: string,
    @Query('page') page?: string,
    @Query('per_page') per_page?: string,
  ) {
    return this.vehiculosService.findAll({
      sede_id:      sede_id  ? parseInt(sede_id, 10)  : undefined,
      tipo_vehiculo,
      activo:       activo !== undefined ? activo === 'true' : undefined,
      placa,
      page:         page     ? parseInt(page, 10)     : undefined,
      per_page:     per_page ? parseInt(per_page, 10) : undefined,
    })
  }

  @Get('vehiculos/:id')
  @Roles(...ROLES_VISUALIZADOR)
  getVehiculo(@Param('id', ParseIntPipe) id: number) {
    return this.vehiculosService.findOne(id)
  }

  @Patch('vehiculos/:id/estado')
  @Roles(...ROLES_GESTION)
  cambiarEstadoVehiculo(
    @Param('id', ParseIntPipe) id: number,
    @Body('activo') activo: boolean,
  ) {
    return this.vehiculosService.cambiarEstado(id, activo)
  }

  // ── Autorizaciones ───────────────────────────────────────────────

  @Get('autorizaciones')
  @Roles(...ROLES_GESTION)
  getAutorizaciones(
    @Query('sede_id') sede_id?: string,
    @Query('estado') estado?: string,
    @Query('tipo_autorizacion') tipo_autorizacion?: string,
    @Query('placa') placa?: string,
    @Query('persona_id') persona_id?: string,
    @Query('page') page?: string,
    @Query('per_page') per_page?: string,
  ) {
    return this.autorizacionesService.findAll({
      sede_id:         sede_id    ? parseInt(sede_id, 10)    : undefined,
      estado,
      tipo_autorizacion,
      placa,
      persona_id:      persona_id ? parseInt(persona_id, 10) : undefined,
      page:            page       ? parseInt(page, 10)       : undefined,
      per_page:        per_page   ? parseInt(per_page, 10)   : undefined,
    })
  }

  @Get('autorizaciones/:id')
  @Roles(...ROLES_GESTION)
  getAutorizacion(@Param('id', ParseIntPipe) id: number) {
    return this.autorizacionesService.findOne(id)
  }

  @Patch('autorizaciones/:id/cupo')
  @Roles(...ROLES_GESTION)
  asignarCupo(
    @Param('id', ParseIntPipe) id: number,
    @Body('cupo_id') cupo_id: number | null,
    @Request() req: any,
  ) {
    return this.autorizacionesService.asignarCupo(id, cupo_id, req.user.id)
  }

  @Post('autorizaciones/:id/suspender')
  @Roles(...ROLES_GESTION)
  suspenderAutorizacion(
    @Param('id', ParseIntPipe) id: number,
    @Body('motivo') motivo: string,
    @Request() req: any,
  ) {
    return this.autorizacionesService.suspender(id, motivo, req.user.id)
  }

  @Post('autorizaciones/:id/reactivar')
  @Roles(...ROLES_GESTION)
  reactivarAutorizacion(
    @Param('id', ParseIntPipe) id: number,
    @Body('motivo') motivo: string,
    @Request() req: any,
  ) {
    return this.autorizacionesService.reactivar(id, motivo, req.user.id)
  }

  @Post('autorizaciones/:id/revocar')
  @Roles(...ROLES_GESTION)
  revocarAutorizacion(
    @Param('id', ParseIntPipe) id: number,
    @Body('motivo') motivo: string,
    @Request() req: any,
  ) {
    return this.autorizacionesService.revocar(id, motivo, req.user.id)
  }

  // ── Zonas ────────────────────────────────────────────────────────

  @Get('zonas')
  @Roles(...ROLES_VISUALIZADOR)
  getZonas(
    @Query('sede_id') sede_id?: string,
    @Query('activa') activa?: string,
  ) {
    return this.zonasService.findAll(
      sede_id ? parseInt(sede_id, 10) : undefined,
      activa  !== undefined ? activa === 'true' : undefined,
    )
  }

  @Post('zonas')
  @Roles(...ROLES_ADMIN)
  createZona(@Body() dto: CreateZonaDto) {
    return this.zonasService.create(dto)
  }

  @Put('zonas/:id')
  @Roles(...ROLES_ADMIN)
  updateZona(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateZonaDto) {
    return this.zonasService.update(id, dto)
  }

  // ── Cupos ────────────────────────────────────────────────────────

  @Get('cupos')
  @Roles(...ROLES_VISUALIZADOR)
  getCupos(@Query() query: ListarCuposDto) {
    return this.zonasService.findAllCupos(query)
  }

  @Post('cupos')
  @Roles(...ROLES_ADMIN)
  createCupo(@Body() dto: CreateCupoDto) {
    return this.zonasService.createCupo(dto)
  }

  @Patch('cupos/:id/estado')
  @Roles(...ROLES_GESTION)
  cambiarEstadoCupo(@Param('id', ParseIntPipe) id: number, @Body() dto: CambiarEstadoCupoDto) {
    return this.zonasService.cambiarEstadoCupo(id, dto)
  }

  @Get('ocupacion/:sedeId')
  @Roles(...ROLES_ALL)
  getOcupacion(@Param('sedeId', ParseIntPipe) sedeId: number) {
    return this.zonasService.getOcupacion(sedeId)
  }

  // ── Portal Vigilante ─────────────────────────────────────────────

  @Post('vigilante/verificar')
  @Roles(...ROLES_VIGILANTE)
  verificar(@Body() dto: VerificarPlacaDto) {
    return this.vigilanteService.verificar(dto)
  }

  @Post('vigilante/entrada')
  @Roles(...ROLES_VIGILANTE)
  registrarEntrada(@Body() dto: RegistrarEntradaDto, @Request() req: any) {
    return this.vigilanteService.registrarEntrada(dto, req.user.id)
  }

  @Post('vigilante/salida')
  @Roles(...ROLES_VIGILANTE)
  registrarSalida(@Body() dto: RegistrarSalidaDto, @Request() req: any) {
    return this.vigilanteService.registrarSalida(dto, req.user.id)
  }

  @Get('vigilante/dentro/:sedeId')
  @Roles(...ROLES_VIGILANTE)
  getDentro(@Param('sedeId', ParseIntPipe) sedeId: number) {
    return this.vigilanteService.getDentroAhora(sedeId)
  }

  @Get('vigilante/ocupacion/:sedeId')
  @Roles(...ROLES_VIGILANTE)
  getOcupacionVigilante(@Param('sedeId', ParseIntPipe) sedeId: number) {
    return this.vigilanteService.getOcupacionSimple(sedeId)
  }

  @Post('vigilante/novedad')
  @Roles(...ROLES_VIGILANTE)
  createNovedadVigilante(@Body() dto: CreateNovedadDto, @Request() req: any) {
    return this.novedadesService.create(dto, req.user.id)
  }

  // ── Accesos ──────────────────────────────────────────────────────

  @Get('accesos')
  @Roles(...ROLES_GESTION)
  getAccesos(
    @Query('sede_id') sede_id?: string,
    @Query('placa') placa?: string,
    @Query('tipo_acceso') tipo_acceso?: string,
    @Query('resultado') resultado?: string,
    @Query('fecha_desde') fecha_desde?: string,
    @Query('fecha_hasta') fecha_hasta?: string,
    @Query('page') page?: string,
    @Query('per_page') per_page?: string,
  ) {
    return this.accesosService.findAll({
      sede_id:    sede_id  ? parseInt(sede_id, 10)  : undefined,
      placa,
      tipo_acceso,
      resultado,
      fecha_desde,
      fecha_hasta,
      page:       page     ? parseInt(page, 10)     : undefined,
      per_page:   per_page ? parseInt(per_page, 10) : undefined,
    })
  }

  @Get('accesos/vehiculo/:placa')
  @Roles(...ROLES_GESTION)
  getAccesosPorVehiculo(
    @Param('placa') placa: string,
    @Query('sede_id') sede_id?: string,
    @Query('fecha_desde') fecha_desde?: string,
    @Query('fecha_hasta') fecha_hasta?: string,
    @Query('page') page?: string,
    @Query('per_page') per_page?: string,
  ) {
    return this.accesosService.findByVehiculo(placa, {
      sede_id: sede_id ? parseInt(sede_id, 10) : undefined,
      fecha_desde, fecha_hasta,
      page:    page    ? parseInt(page, 10)    : undefined,
      per_page: per_page ? parseInt(per_page, 10) : undefined,
    })
  }

  // ── Novedades ────────────────────────────────────────────────────

  @Get('novedades')
  @Roles(...ROLES_VIGILANTE)
  getNovedades(
    @Query('sedeId') sedeId?: string,
    @Query('estado') estado?: string,
    @Query('tipoNovedad') tipoNovedad?: string,
    @Query('placa') placa?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.novedadesService.findAll({
      sedeId:    sedeId  ? parseInt(sedeId, 10)  : undefined,
      estado, tipoNovedad, placa, fechaDesde, fechaHasta,
      page:       page     ? parseInt(page, 10)     : undefined,
      perPage:   perPage ? parseInt(perPage, 10) : undefined,
    })
  }

  @Get('novedades/:id')
  @Roles(...ROLES_VIGILANTE)
  getNovedad(@Param('id', ParseIntPipe) id: number) {
    return this.novedadesService.findOne(id)
  }

  @Post('novedades')
  @Roles(...ROLES_VIGILANTE)
  createNovedad(@Body() dto: CreateNovedadDto, @Request() req: any) {
    return this.novedadesService.create(dto, req.user.id)
  }

  @Put('novedades/:id')
  @Roles(...ROLES_GESTION)
  updateNovedad(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateNovedadDto) {
    return this.novedadesService.update(id, dto)
  }

  @Post('novedades/:id/escalar')
  @Roles(...ROLES_GESTION)
  escalarNovedad(@Param('id', ParseIntPipe) id: number, @Body() dto: EscalarNovedadDto) {
    return this.novedadesService.escalar(id, dto)
  }

  @Post('novedades/:id/cerrar')
  @Roles(...ROLES_GESTION)
  cerrarNovedad(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CerrarNovedadDto,
    @Request() req: any,
  ) {
    return this.novedadesService.cerrar(id, dto, req.user.id)
  }

  @Post('novedades/:id/anular')
  @Roles(...ROLES_GESTION)
  anularNovedad(@Param('id', ParseIntPipe) id: number, @Body() dto: AnularNovedadDto) {
    return this.novedadesService.anular(id, dto)
  }

  // ── Excepciones ──────────────────────────────────────────────────

  @Get('excepciones')
  @Roles(...ROLES_GESTION)
  getExcepciones(
    @Query('sedeId') sedeId?: string,
    @Query('tipoExcepcion') tipoExcepcion?: string,
    @Query('activa') activa?: string,
    @Query('placa') placa?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.excepcionesService.findAll({
      sedeId:   sedeId ? parseInt(sedeId, 10) : undefined,
      tipoExcepcion,
      activa:    activa !== undefined ? activa === 'true' : undefined,
      placa,
      fechaDesde,
      fechaHasta,
      page:      page    ? parseInt(page, 10)    : undefined,
      perPage:  perPage ? parseInt(perPage, 10) : undefined,
    })
  }

  @Post('excepciones')
  @Roles(...ROLES_GESTION)
  createExcepcion(@Body() dto: CreateExcepcionDto, @Request() req: any) {
    return this.excepcionesService.create(dto, req.user.id)
  }

  @Post('excepciones/lote')
  @Roles(...ROLES_GESTION)
  createExcepcionLote(@Body() dto: CreateExcepcionLoteDto, @Request() req: any) {
    return this.excepcionesService.crearLote(dto, req.user.id)
  }

  @Post('excepciones/:id/activar')
  @Roles(...ROLES_GESTION)
  activarExcepcion(@Param('id', ParseIntPipe) id: number) {
    return this.excepcionesService.activar(id)
  }

  @Post('excepciones/:id/desactivar')
  @Roles(...ROLES_GESTION)
  desactivarExcepcion(@Param('id', ParseIntPipe) id: number) {
    return this.excepcionesService.desactivar(id)
  }

  @Post('excepciones/:id/anular')
  @Roles(...ROLES_GESTION)
  anularExcepcion(@Param('id', ParseIntPipe) id: number, @Body() dto: AnularExcepcionDto) {
    return this.excepcionesService.anular(id, dto)
  }

  // ── Reportes ─────────────────────────────────────────────────────

  @Get('reportes/accesos')
  @Roles(...ROLES_VISUALIZADOR)
  reporteAccesos(
    @Query('sede_id') sede_id: string,
    @Query('fecha_desde') fecha_desde: string,
    @Query('fecha_hasta') fecha_hasta: string,
    @Query('tipo_vehiculo') tipo_vehiculo?: string,
    @Query('resultado') resultado?: string,
  ) {
    return this.reportesService.reporteAccesos({
      sede_id: parseInt(sede_id, 10), fecha_desde, fecha_hasta, tipo_vehiculo, resultado,
    })
  }

  @Get('reportes/autorizaciones')
  @Roles(...ROLES_VISUALIZADOR)
  reporteAutorizaciones(
    @Query('sede_id') sede_id?: string,
    @Query('estado') estado?: string,
    @Query('tipo_autorizacion') tipo_autorizacion?: string,
    @Query('fecha_desde') fecha_desde?: string,
    @Query('fecha_hasta') fecha_hasta?: string,
  ) {
    return this.reportesService.reporteAutorizaciones({
      sede_id: sede_id ? parseInt(sede_id, 10) : undefined,
      estado, tipo_autorizacion, fecha_desde, fecha_hasta,
    })
  }

  @Get('reportes/vencimientos')
  @Roles(...ROLES_VISUALIZADOR)
  reporteVencimientos(
    @Query('sede_id') sede_id: string,
    @Query('dias_proximos') dias_proximos?: string,
  ) {
    return this.reportesService.reporteVencimientos({
      sede_id: parseInt(sede_id, 10),
      dias_proximos: dias_proximos ? parseInt(dias_proximos, 10) : undefined,
    })
  }

  @Get('reportes/novedades')
  @Roles(...ROLES_VISUALIZADOR)
  reporteNovedades(
    @Query('sede_id') sede_id?: string,
    @Query('estado') estado?: string,
    @Query('tipo_novedad') tipo_novedad?: string,
    @Query('fecha_desde') fecha_desde?: string,
    @Query('fecha_hasta') fecha_hasta?: string,
  ) {
    return this.reportesService.reporteNovedades({
      sede_id: sede_id ? parseInt(sede_id, 10) : undefined,
      estado, tipo_novedad, fecha_desde, fecha_hasta,
    })
  }

  @Get('reportes/vehiculos')
  @Roles(...ROLES_VISUALIZADOR)
  reporteVehiculos(
    @Query('sede_id') sede_id?: string,
    @Query('tipo_vehiculo') tipo_vehiculo?: string,
    @Query('activo') activo?: string,
  ) {
    return this.reportesService.reporteVehiculos({
      sede_id: sede_id ? parseInt(sede_id, 10) : undefined,
      tipo_vehiculo,
      activo: activo !== undefined ? activo === 'true' : undefined,
    })
  }

  @Get('reportes/excepciones')
  @Roles(...ROLES_VISUALIZADOR)
  reporteExcepciones(
    @Query('sede_id') sede_id?: string,
    @Query('activa') activa?: string,
    @Query('tipo_excepcion') tipo_excepcion?: string,
    @Query('fecha_desde') fecha_desde?: string,
    @Query('fecha_hasta') fecha_hasta?: string,
  ) {
    return this.reportesService.reporteExcepciones({
      sede_id: sede_id ? parseInt(sede_id, 10) : undefined,
      activa: activa !== undefined ? activa === 'true' : undefined,
      tipo_excepcion, fecha_desde, fecha_hasta,
    })
  }

  @Get('reportes/charts')
  @Roles(...ROLES_VISUALIZADOR)
  reporteCharts(
    @Query('sede_id') sede_id: string,
    @Query('periodo') periodo?: '7d' | '30d' | '90d',
  ) {
    return this.reportesService.charts({ sede_id: parseInt(sede_id, 10), periodo })
  }

  // ── Configuración ────────────────────────────────────────────────

  @Get('configuracion/:sedeId')
  @Roles(...ROLES_GESTION)
  getConfiguracion(@Param('sedeId', ParseIntPipe) sedeId: number) {
    return this.configuracionService.getPolitica(sedeId)
  }

  @Put('configuracion/:sedeId')
  @Roles(...ROLES_ADMIN)
  updateConfiguracion(
    @Param('sedeId', ParseIntPipe) sedeId: number,
    @Body() dto: UpdatePoliticaDto,
  ) {
    return this.configuracionService.updatePolitica(sedeId, dto)
  }

  @Post('configuracion/:sedeId/inicializar')
  @Roles(...ROLES_ADMIN)
  inicializarConfiguracion(@Param('sedeId', ParseIntPipe) sedeId: number) {
    return this.configuracionService.inicializar(sedeId)
  }
}
