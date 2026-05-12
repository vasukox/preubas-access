import { Controller, Get, Post, Put, Delete, Patch, Body, Query, Param, ParseIntPipe, UseGuards, Request, HttpException, HttpStatus, Res, BadRequestException, NotFoundException } from '@nestjs/common';
import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { HseService } from './hse.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { RolNombre } from '../common/enums/rol.enum';

import { AutogestionTokenGuard } from '../common/guards/autogestion-token.guard';

import { CreateAutorizacionDto, UpdateAutorizacionDto, ChangeEstadoAutorizacionDto } from './dto/autorizacion.dto';
import { CreateContratistaDto } from './dto/contratista.dto';
import { 
  ClasificacionDto, 
  SegSocialItemDto, 
  SegSocialRequestDto,
  CertificacionesDto, 
  ExamenMedicoDto, 
  ContactoEmergenciaDto, 
  AceptacionNormasDto 
} from './dto/autogestion.dto';
import { VerificarAccesoDto, RegistrarAccesoDto } from './dto/acceso.dto';
import { CumplimientoIniciarDto } from './dto/cumplimiento.dto';
import { CreateExcepcionDto, CreateExcepcionLoteDto } from './dto/excepcion.dto';
import { AutorizacionService } from './services/autorizacion.service';
import { AutogestionService } from './services/autogestion.service';
import { AccesoService } from './services/acceso.service';
import { CumplimientoService } from './services/cumplimiento.service';
import { ExcepcionService } from './services/excepcion.service';
import { ReportesService } from './services/reportes.service';
import { ProveedorService } from '../persona/proveedor.service';
import { CreateProveedorDto, UpdateProveedorDto } from '../persona/dto/proveedor.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import type { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

export class CrearProveedorFrontendDto {
  @IsString()
  nombre: string;

  @IsString()
  nit: string;
}

export class ActualizarProveedorFrontendDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  nit?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hse')
export class HseController {
  constructor(
    private readonly hseService: HseService,
    private readonly autorizacionService: AutorizacionService,
    private readonly autogestionService: AutogestionService,
    private readonly accesoService: AccesoService,
    private readonly cumplimientoService: CumplimientoService,
    private readonly excepcionService: ExcepcionService,
    private readonly reportesService: ReportesService,
    private readonly proveedorService: ProveedorService,
  ) {}

  @Public()
  @Get('catalogos/sedes')
  async getSedes(@Request() req: any) {
    return this.hseService.getCatalogosSedes(req.user || {});
  }

  @Public()
  @Get('catalogos/eps')
  async getEps() {
    return this.hseService.getCatalogosEps();
  }

  @Public()
  @Get('catalogos/arl')
  async getArl() {
    return this.hseService.getCatalogosArl();
  }

  @Public()
  @Get('catalogos/afp')
  async getAfp() {
    return this.hseService.getCatalogosAfp();
  }

  @Public()
  @Get('catalogos/normas/:sede_id')
  async getNormas(@Param('sede_id', ParseIntPipe) sedeId: number) {
    return this.hseService.getCatalogosNormas(sedeId);
  }

  @Get('catalogos/proveedores')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE, RolNombre.VISUALIZADOR, RolNombre.ADMIN_GLOBAL)
  async getProveedores() {
    const proveedores = await this.proveedorService.findActivos();
    return proveedores.map(p => ({ id: p.id, nombre: p.nomProveedor, nit: p.nitProveedor ?? '', activo: p.estadoProv }));
  }

  @Post('catalogos/proveedores')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE, RolNombre.ADMIN_GLOBAL)
  async crearProveedor(@Body() body: CrearProveedorFrontendDto) {
    const p = await this.proveedorService.create({
      nomProveedor: body.nombre,
      nitProveedor: body.nit,
      estadoProv: true,
    } as any);
    return { id: p.id, nombre: p.nomProveedor, activo: p.estadoProv };
  }

  @Put('catalogos/proveedores/:id')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE, RolNombre.ADMIN_GLOBAL)
  async actualizarProveedor(@Param('id', ParseIntPipe) id: number, @Body() body: ActualizarProveedorFrontendDto) {
    const p = await this.proveedorService.update(id, {
      nomProveedor: body.nombre,
      nitProveedor: body.nit,
      estadoProv: body.activo !== undefined ? body.activo : undefined,
    } as any);
    return { id: p.id, nombre: p.nomProveedor, activo: p.estadoProv };
  }

  @Delete('catalogos/proveedores/:id')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE, RolNombre.ADMIN_GLOBAL)
  async eliminarProveedor(@Param('id', ParseIntPipe) id: number) {
    return this.proveedorService.remove(id);
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
      const result = await this.autorizacionService.findAll(sedeId, estado, p, pp);
      return result.items; 
    } catch (e: any) {
      throw new HttpException({ error: e.message, stack: e.stack }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('autorizaciones/:id')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE, RolNombre.VISUALIZADOR)
  async getAutorizacion(@Param('id', ParseIntPipe) id: number) {
    return this.autorizacionService.findOne(id);
  }

  @Post('autorizaciones')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE)
  async createAutorizacion(
    @Request() req: any,
    @Body() createDto: CreateAutorizacionDto
  ) {
    return this.autorizacionService.create(createDto, req.user?.id);
  }

  @Put('autorizaciones/:id')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE)
  async updateAutorizacion(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateAutorizacionDto
  ) {
    return this.autorizacionService.update(id, updateDto);
  }

  @Delete('autorizaciones/:id')
  @Roles(RolNombre.ADMIN_HSE)
  async deleteAutorizacion(@Param('id', ParseIntPipe) id: number) {
    return this.autorizacionService.delete(id);
  }

  @Patch('autorizaciones/:id/estado')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE)
  async cambiarEstadoAutorizacion(
    @Param('id', ParseIntPipe) id: number,
    @Body() changeEstadoDto: ChangeEstadoAutorizacionDto
  ) {
    return this.autorizacionService.cambiarEstado(id, changeEstadoDto);
  }

  @Get('autorizaciones/:id/contratistas')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE, RolNombre.VISUALIZADOR)
  async getContratistas(@Param('id', ParseIntPipe) id: number) {
    return this.autorizacionService.getContratistas(id);
  }

  @Post('autorizaciones/:id/contratistas')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE)
  async addContratistas(
    @Param('id', ParseIntPipe) id: number,
    @Body() contratistasDto: CreateContratistaDto[]
  ) {
    return this.autorizacionService.addContratistas(id, contratistasDto);
  }

  @Post('contratistas/:id/generar-token')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE)
  async generarTokenContratista(@Param('id', ParseIntPipe) id: number) {
    return this.autorizacionService.generarTokenContratista(id);
  }

  @Post('contratistas/:id/token')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE)
  async renovarTokenFrontend(@Param('id', ParseIntPipe) id: number) {
    const result = await this.autorizacionService.generarTokenContratista(id);
    return result.token;
  }

  @Get('contratistas/:id')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE, RolNombre.VISUALIZADOR, RolNombre.VIGILANTE_HSE)
  async getContratista(@Param('id', ParseIntPipe) id: number) {
    return this.autorizacionService.findOneContratista(id);
  }

  @Post('contratistas/:id/aprobar')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE)
  async aprobarContratista(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.autorizacionService.aprobarContratista(id, req.user?.id);
  }

  @Post('contratistas/:id/denegar')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE)
  async denegarContratista(@Param('id', ParseIntPipe) id: number, @Body('motivo') motivo: string, @Request() req: any) {
    return this.autorizacionService.denegarContratista(id, motivo, req.user?.id);
  }

  @Put('contratistas/:id/proveedor')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE)
  async actualizarProveedorContratista(@Param('id', ParseIntPipe) id: number, @Body('proveedor_id') proveedorId: number) {
    return this.autorizacionService.actualizarProveedorContratista(id, proveedorId ?? null);
  }

  @Post('contratistas/:id/eliminar')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE)
  async eliminarContratista(@Param('id', ParseIntPipe) id: number, @Body() data: any, @Request() req: any) {
    return this.autorizacionService.eliminarContratista(id, data?.motivo, req.user?.id);
  }

  @Post('contratistas/:id/adjuntos/eliminar')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE)
  async eliminarAdjuntoContratista(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.autorizacionService.eliminarAdjuntoContratista(id, data);
  }

  // --- Autogestión ---
  @Public()
  @UseGuards(AutogestionTokenGuard)
  @Get('autogestion/:token')
  async getAutogestionDatos(@Request() req: any) {
    return this.autogestionService.getDatosIniciales(req.contratista);
  }

  @Public()
  @UseGuards(AutogestionTokenGuard)
  @Post('autogestion/:token/upload')
  @UseInterceptors(FileInterceptor('archivo'))
  async uploadArchivo(
    @Request() req: any,
    @Param('token') token: string,
    @Body('modulo') modulo: string,
    @Body('campo') campo: string,
    @UploadedFile() archivo: any
  ) {
    if (!archivo) {
      throw new BadRequestException('Archivo requerido');
    }

    const moduloSeguro = this.validarSegmentoArchivo(modulo);
    const campoSeguro = this.validarSegmentoArchivo(campo);
    const ext = path.extname(archivo.originalname || '').toLowerCase();
    const nombreArchivo = `${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`;
    const relativePath = path.posix.join('hse', String(req.contratista.id), moduloSeguro, campoSeguro, nombreArchivo);
    const fullPath = this.resolveUploadPath(relativePath);

    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, archivo.buffer);

    return {
      modulo,
      campo,
      path: relativePath,
      filename: archivo.originalname,
      contentType: archivo.mimetype,
      sizeBytes: archivo.size,
    };
  }

  @Public()
  @UseGuards(AutogestionTokenGuard)
  @Post('autogestion/:token/datos-personales')
  async guardarDatosPersonales(@Request() req: any, @Body() dto: any) {
    return this.autogestionService.guardarDatosPersonales(req.contratista.id, dto);
  }

  @Public()
  @UseGuards(AutogestionTokenGuard)
  @Post('autogestion/:token/clasificacion')
  async guardarClasificacion(@Request() req: any, @Body() dto: ClasificacionDto) {
    return this.autogestionService.guardarClasificacion(req.contratista.id, dto);
  }

  @Public()
  @UseGuards(AutogestionTokenGuard)
  @Post('autogestion/:token/seguridad-social')
  async guardarSeguridadSocial(@Request() req: any, @Body() payload: any) {
    // Parsear payload: frontend envía { personas: [...] } pero service espera array directo
    const dto = Array.isArray(payload) ? payload : (payload?.personas || []);
    return this.autogestionService.guardarSeguridadSocial(req.contratista.id, dto);
  }

  @Public()
  @UseGuards(AutogestionTokenGuard)
  @Post('autogestion/:token/certificaciones')
  async guardarCertificaciones(@Request() req: any, @Body() dto: CertificacionesDto) {
    return this.autogestionService.guardarCertificaciones(req.contratista.id, dto);
  }

  @Public()
  @UseGuards(AutogestionTokenGuard)
  @Post('autogestion/:token/examen-medico')
  async guardarExamenMedico(@Request() req: any, @Body() dto: ExamenMedicoDto) {
    return this.autogestionService.guardarExamenMedico(req.contratista.id, dto);
  }

  @Public()
  @UseGuards(AutogestionTokenGuard)
  @Post('autogestion/:token/contacto-emergencia')
  async guardarContactoEmergencia(@Request() req: any, @Body() dto: ContactoEmergenciaDto) {
    return this.autogestionService.guardarContactoEmergencia(req.contratista.id, dto);
  }

  @Public()
  @UseGuards(AutogestionTokenGuard)
  @Post('autogestion/:token/aceptacion')
  async guardarAceptacionNormas(@Request() req: any, @Body() dto: AceptacionNormasDto) {
    return this.autogestionService.guardarAceptacionNormas(req.contratista.id, dto);
  }

  @Public()
  @UseGuards(AutogestionTokenGuard)
  @Post('autogestion/:token/normas')
  async guardarAceptacionNormasFrontend(@Request() req: any, @Body() dto: AceptacionNormasDto) {
    return this.autogestionService.guardarAceptacionNormas(req.contratista.id, dto);
  }

  @Public()
  @UseGuards(AutogestionTokenGuard)
  @Post('autogestion/:token/finalizar')
  async finalizarAutogestion(@Request() req: any) {
    return this.autogestionService.finalizarAutogestion(req.contratista.id);
  }

  @Get('dashboard/:sedeId')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE, RolNombre.VISUALIZADOR)
  async getDashboard(@Param('sedeId', ParseIntPipe) sedeId: number) {
    return this.hseService.getDashboard(sedeId);
  }

  // --- Accesos (Portería) ---
  @Post('accesos/entrada')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE, RolNombre.VIGILANTE_HSE)
  async registrarEntrada(@Request() req: any, @Body() body: any) {
    const contratistaId = body.contratistaId ?? body.contratista_id;
    const sedeId = body.sedeId ?? body.sede_id;
    const metodo = body.metodo ?? body.puerta;
    const observacion = body.observacion ?? body.observaciones;
    const ubicacionId = body.ubicacionId ?? body.ubicacion_id;
    return this.accesoService.registrarEntrada(contratistaId, sedeId, req.user?.id, metodo, observacion, ubicacionId);
  }

  @Post('accesos/salida')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE, RolNombre.VIGILANTE_HSE)
  async registrarSalida(@Request() req: any, @Body() body: any) {
    const contratistaId = body.contratistaId ?? body.contratista_id;
    const sedeId = body.sedeId ?? body.sede_id;
    const metodo = body.metodo ?? body.puerta;
    const observacion = body.observacion ?? body.observaciones;
    const ubicacionId = body.ubicacionId ?? body.ubicacion_id;
    return this.accesoService.registrarSalida(contratistaId, sedeId, req.user?.id, metodo, observacion, ubicacionId);
  }

  @Get('accesos/sede/:sede_id')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE, RolNombre.VIGILANTE_HSE, RolNombre.VISUALIZADOR)
  async getAccesosSede(@Param('sede_id', ParseIntPipe) sedeId: number) {
    return this.accesoService.getHistorialSede(sedeId);
  }

  @Get('vigilante/dentro/:sede_id')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE, RolNombre.VIGILANTE_HSE, RolNombre.VISUALIZADOR)
  async getPersonasDentro(@Param('sede_id', ParseIntPipe) sedeId: number) {
    return this.accesoService.getPersonasDentro(sedeId);
  }

  @Post('vigilante/verificar')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.VIGILANTE_HSE)
  async verificarAcceso(@Body() dto: VerificarAccesoDto) {
    return this.accesoService.verificarAcceso(dto.numeroDocumento, dto.sedeId);
  }

  @Post('vigilante/acceso')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.VIGILANTE_HSE)
  async registrarAccesoVigilante(@Request() req: any, @Body() dto: RegistrarAccesoDto) {
    return this.accesoService.registrarAcceso(dto, req.user?.id);
  }

  // --- Cumplimiento ---
  @Get('cumplimiento/:id')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE)
  async getCumplimiento(@Param('id', ParseIntPipe) id: number) {
    return this.cumplimientoService.getById(id);
  }

  @Get('cumplimiento')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE)
  async listarCumplimientos(
    @Query('sede_id') sedeIdStr: string,
    @Query('estado') estado?: string
  ) {
    const sedeId = sedeIdStr ? parseInt(sedeIdStr, 10) : 0;
    return this.cumplimientoService.listarCumplimientos(sedeId, estado);
  }

  @Post('cumplimiento')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE)
  async iniciarCumplimiento(@Request() req: any, @Body() dto: any) {
    const contratistaId = dto.contratistaId ?? dto.contratista_id;
    const sedeId = dto.sedeId ?? dto.sede_id;
    const itemsRequisitos = dto.itemsRequisitos ?? dto.items_requisitos;
    return this.cumplimientoService.iniciarCumplimiento(
      contratistaId,
      req.user?.id,
      sedeId,
      itemsRequisitos
    );
  }

  @Post('cumplimiento/iniciar')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE)
  async iniciarCumplimientoFrontend(@Request() req: any, @Body() dto: any) {
    const contratistaId = dto.contratistaId ?? dto.contratista_id;
    const sedeId = dto.sedeId ?? dto.sede_id;
    const itemsRequisitos = dto.itemsRequisitos ?? dto.items_requisitos;
    return this.cumplimientoService.iniciarCumplimiento(
      contratistaId,
      req.user?.id,
      sedeId,
      itemsRequisitos
    );
  }

  @Put('cumplimiento/:id')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE)
  async actualizarCumplimiento(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.cumplimientoService.actualizarCumplimiento(id, body);
  }

  @Put('cumplimiento/:id/items/:itemId')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE)
  async marcarItemCumplimiento(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() body: any
  ) {
    const cumple = body.cumple ?? body.esCumplido;
    return this.cumplimientoService.marcarItem(id, itemId, cumple, body.observacion);
  }

  @Post('cumplimiento/:id/cerrar')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE)
  async cerrarCumplimiento(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    const firmaDigital = body.firmaDigital ?? body.firma_digital;
    const observacionGeneral = body.observacionGeneral ?? body.observacion_general;
    return this.cumplimientoService.cerrarCumplimiento(id, firmaDigital, observacionGeneral);
  }

  // --- Excepciones ---
  @Post('excepciones')
  @Roles(RolNombre.ADMIN_HSE)
  async crearExcepcion(@Request() req: any, @Body() dto: CreateExcepcionDto) {
    return this.excepcionService.crearExcepcion(req.user?.id, dto);
  }

  @Post('excepciones/lote')
  @Roles(RolNombre.ADMIN_HSE)
  async crearExcepcionLote(@Request() req: any, @Body() dto: CreateExcepcionLoteDto) {
    return this.excepcionService.crearExcepcionLote(req.user?.id, dto);
  }

  // IMPORTANTE: la ruta con segmento estático 'activas' debe ir ANTES de /:sede_id
  // para que Express no la intercepte como sede_id='activas'
  @Get('excepciones/activas/:persona_id')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE, RolNombre.VIGILANTE_HSE)
  async getExcepcionesActivas(@Param('persona_id', ParseIntPipe) personaId: number) {
    return this.excepcionService.getExcepcionesActivas(personaId);
  }

  @Get('excepciones/detalle/:id')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE, RolNombre.VIGILANTE_HSE, RolNombre.VISUALIZADOR)
  async getExcepcionDetalle(@Param('id', ParseIntPipe) id: number) {
    return this.excepcionService.obtenerDetalle(id);
  }

  @Get('excepciones/sede/:sede_id')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE, RolNombre.VIGILANTE_HSE, RolNombre.VISUALIZADOR)
  async getExcepcionesSede(@Param('sede_id', ParseIntPipe) sedeId: number) {
    return this.excepcionService.listarExcepciones(sedeId);
  }

  // Alias para la UI frontend que consulta /hse/excepciones/:sede_id en GET
  @Get('excepciones/:sede_id')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE, RolNombre.VIGILANTE_HSE, RolNombre.VISUALIZADOR)
  async getExcepcionesPorSedeAlias(@Param('sede_id', ParseIntPipe) sedeId: number) {
    return this.excepcionService.listarExcepciones(sedeId);
  }

  @Put('excepciones/:id/anular')
  @Roles(RolNombre.ADMIN_HSE)
  async anularExcepcion(@Param('id', ParseIntPipe) id: number) {
    return this.excepcionService.anularExcepcion(id);
  }

  @Post('excepciones/:id/desactivar')
  @Roles(RolNombre.ADMIN_HSE)
  async desactivarExcepcion(@Param('id', ParseIntPipe) id: number) {
    return this.excepcionService.anularExcepcion(id);
  }

  @Post('excepciones/:id/activar')
  @Roles(RolNombre.ADMIN_HSE)
  async activarExcepcion(@Param('id', ParseIntPipe) id: number) {
    return this.excepcionService.activarExcepcion(id);
  }

  @Put('excepciones/:id')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE)
  async actualizarExcepcion(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.excepcionService.actualizarExcepcion(id, dto);
  }

  // --- Reportes ---
  @Get('reportes/accesos')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE, RolNombre.VISUALIZADOR)
  async getReporteAccesos(@Query() query: any) {
    return this.reportesService.getReporteAccesos(query);
  }

  @Get('reportes/cumplimiento')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE, RolNombre.VISUALIZADOR)
  async getReporteCumplimiento(@Query() query: any) {
    return this.reportesService.getReporteCumplimiento(query);
  }

  @Get('reportes/vencimientos')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE, RolNombre.VISUALIZADOR)
  async getReporteVencimientos() {
    return this.reportesService.getReporteVencimientos();
  }

  // --- Archivos ---
  @Get('archivos/*')
  async servirArchivoHse(@Request() req: any, @Res() res: Response) {
    const rawPath = req.params?.[0] ?? '';
    const fullPath = this.resolveUploadPath(rawPath);

    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
      throw new NotFoundException('Archivo no encontrado');
    }

    return res.sendFile(fullPath);
  }

  private validarSegmentoArchivo(value: string) {
    if (!value || !/^[a-zA-Z0-9_-]+$/.test(value)) {
      throw new BadRequestException('Ruta de archivo invalida');
    }
    return value;
  }

  private resolveUploadPath(relativePath: string) {
    const uploadRoot = path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'));
    const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
    const fullPath = path.resolve(uploadRoot, normalized);

    if (!fullPath.startsWith(uploadRoot)) {
      throw new BadRequestException('Ruta de archivo invalida');
    }

    return fullPath;
  }
}
