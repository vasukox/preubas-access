import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';

import { ConfigKoajService } from './config-koaj.service';
import {
  CreateSedeDto,
  UpdateSedeDto,
  CreateUbicacionDto,
  UpdateUbicacionDto,
  CreateCatalogoDto,
  UpdateCatalogoDto,
  CreateNormaDto,
  UpdateNormaDto,
} from './dto/config-koaj.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolNombre } from '../common/enums/rol.enum';

/**
 * ConfigKoajController — configuración global del sistema KOAJ Access.
 *
 * Equivalente a `app/routers/config.py` en Python.
 *
 * Acceso: exclusivo ADMIN_GLOBAL (RBAC en cada endpoint).
 *
 * ── Rutas disponibles ────────────────────────────────────────────────────────
 *
 * Sedes:
 *   GET    /api/v1/config/sedes             → listar todas
 *   GET    /api/v1/config/sedes/:id         → detalle con ubicaciones
 *   POST   /api/v1/config/sedes             → crear sede
 *   PUT    /api/v1/config/sedes/:id         → actualizar sede
 *
 * Ubicaciones:
 *   GET    /api/v1/config/sedes/:id/ubicaciones   → listar de una sede
 *   POST   /api/v1/config/ubicaciones             → crear ubicación
 *   PUT    /api/v1/config/ubicaciones/:id         → actualizar
 *   DELETE /api/v1/config/ubicaciones/:id         → eliminar (soft)
 *
 * Catálogos (EPS / ARL / AFP):
 *   GET    /api/v1/config/catalogos/:tipo         → listar (tipo: eps|arl|afp)
 *   POST   /api/v1/config/catalogos/:tipo         → crear item
 *   PUT    /api/v1/config/catalogos/:tipo/:id     → actualizar item
 *   DELETE /api/v1/config/catalogos/:tipo/:id     → eliminar item (soft)
 *
 * Normas de seguridad:
 *   GET    /api/v1/config/normas                  → listar (query: ?sede_id=N)
 *   POST   /api/v1/config/normas                  → crear
 *   PUT    /api/v1/config/normas/:id              → actualizar
 *   DELETE /api/v1/config/normas/:id              → eliminar (soft)
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolNombre.ADMIN_GLOBAL)
@Controller('config')
export class ConfigKoajController {
  constructor(private readonly configService: ConfigKoajService) {}

  // ══════════════════════════════════════════════════════════════════════════
  // SISTEMA
  // ══════════════════════════════════════════════════════════════════════════

  @Get('sistema')
  getSistema() {
    return {
      access_token_expire_minutes: 60,
      refresh_token_expire_days: 7,
      max_upload_size_mb: 10,
      allowed_origins: ['*'],
      debug: process.env.NODE_ENV !== 'production',
      environment: process.env.NODE_ENV || 'development'
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SEDES
  // ══════════════════════════════════════════════════════════════════════════

  /** GET /config/sedes */
  @Get('sedes')
  listarSedes() {
    return this.configService.listarSedes();
  }

  /** GET /config/sedes/:id */
  @Get('sedes/:id')
  getSede(@Param('id', ParseIntPipe) id: number) {
    return this.configService.getSede(id);
  }

  /** POST /config/sedes */
  @Post('sedes')
  @HttpCode(HttpStatus.CREATED)
  crearSede(@Body() dto: CreateSedeDto) {
    return this.configService.crearSede(dto);
  }

  /** PUT /config/sedes/:id */
  @Put('sedes/:id')
  actualizarSede(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSedeDto,
  ) {
    return this.configService.actualizarSede(id, dto);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // UBICACIONES
  // ══════════════════════════════════════════════════════════════════════════

  /** GET /config/sedes/:id/ubicaciones */
  @Get('sedes/:id/ubicaciones')
  listarUbicaciones(@Param('id', ParseIntPipe) sedeId: number) {
    return this.configService.listarUbicaciones(sedeId);
  }

  /** POST /config/ubicaciones */
  @Post('ubicaciones')
  @HttpCode(HttpStatus.CREATED)
  crearUbicacion(@Body() dto: CreateUbicacionDto) {
    return this.configService.crearUbicacion(dto);
  }

  /** PUT /config/ubicaciones/:id */
  @Put('ubicaciones/:id')
  actualizarUbicacion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUbicacionDto,
  ) {
    return this.configService.actualizarUbicacion(id, dto);
  }

  /** DELETE /config/ubicaciones/:id */
  @Delete('ubicaciones/:id')
  @HttpCode(HttpStatus.OK)
  eliminarUbicacion(@Param('id', ParseIntPipe) id: number) {
    return this.configService.eliminarUbicacion(id);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CATÁLOGOS (EPS / ARL / AFP)
  // ══════════════════════════════════════════════════════════════════════════

  /** GET /config/catalogos/:tipo */
  @Get('catalogos/:tipo')
  listarCatalogo(@Param('tipo') tipo: string) {
    return this.configService.listarCatalogo(tipo as any);
  }

  /** POST /config/catalogos/:tipo */
  @Post('catalogos/:tipo')
  @HttpCode(HttpStatus.CREATED)
  crearItemCatalogo(
    @Param('tipo') tipo: string,
    @Body() dto: CreateCatalogoDto,
  ) {
    return this.configService.crearItemCatalogo(tipo as any, dto);
  }

  /** PUT /config/catalogos/:tipo/:id */
  @Put('catalogos/:tipo/:id')
  actualizarItemCatalogo(
    @Param('tipo') tipo: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCatalogoDto,
  ) {
    return this.configService.actualizarItemCatalogo(tipo as any, id, dto);
  }

  /** DELETE /config/catalogos/:tipo/:id */
  @Delete('catalogos/:tipo/:id')
  @HttpCode(HttpStatus.OK)
  eliminarItemCatalogo(
    @Param('tipo') tipo: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.configService.eliminarItemCatalogo(tipo as any, id);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // NORMAS DE SEGURIDAD
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * GET /config/normas
   * Query param opcional: ?sede_id=N
   * Sin sede_id → retorna todas | Con sede_id → sede + globales
   *
   * IMPORTANTE: este endpoint también lo consume el portal de autogestión
   * (sin autenticación). Por eso el mismo método se expone en HseModule
   * como ruta pública. Aquí lo sirve el admin con auth.
   */
  @Get('normas')
  listarNormas(@Query('sede_id') sedeId?: string) {
    const id = sedeId ? parseInt(sedeId, 10) : undefined;
    return this.configService.listarNormas(id);
  }

  /** POST /config/normas */
  @Post('normas')
  @HttpCode(HttpStatus.CREATED)
  crearNorma(@Body() dto: CreateNormaDto) {
    return this.configService.crearNorma(dto);
  }

  /** PUT /config/normas/:id */
  @Put('normas/:id')
  actualizarNorma(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNormaDto,
  ) {
    return this.configService.actualizarNorma(id, dto);
  }

  /** DELETE /config/normas/:id */
  @Delete('normas/:id')
  @HttpCode(HttpStatus.OK)
  eliminarNorma(@Param('id', ParseIntPipe) id: number) {
    return this.configService.eliminarNorma(id);
  }
}
