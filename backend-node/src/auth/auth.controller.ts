import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { RolNombre } from '../common/enums/rol.enum';

/**
 * AuthController — endpoints de autenticación.
 *
 * Equivalente a `auth_router` en Python (app/routers/auth.py).
 *
 * Rutas:
 *   POST /api/v1/auth/login           → login (público)
 *   POST /api/v1/auth/refresh         → refresh token (público)
 *   POST /api/v1/auth/logout          → logout (requiere JWT)
 *   GET  /api/v1/auth/me              → perfil actual (requiere JWT)
 *   POST /api/v1/auth/change-password → cambiar contraseña (requiere JWT)
 */
@UseGuards(JwtAuthGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── POST /auth/login ───────────────────────────────────────────────────────

  /**
   * Autentica un usuario con email y contraseña.
   * Retorna access_token + refresh_token + datos básicos del usuario.
   *
   * No requiere JWT — es la puerta de entrada al sistema.
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ipAddress = this.getClientIp(req);
    const userAgent = req.headers['user-agent'];
    return this.authService.login(dto, ipAddress, userAgent);
  }

  // ── POST /auth/refresh ─────────────────────────────────────────────────────

  /**
   * Rota el refresh token y emite un nuevo par de tokens.
   * El refresh token usado queda revocado (one-time use).
   *
   * No requiere JWT — el refresh token es la credencial.
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    const ipAddress = this.getClientIp(req);
    const userAgent = req.headers['user-agent'];
    return this.authService.refreshTokens(dto.refresh_token, ipAddress, userAgent);
  }

  // ── POST /auth/logout ──────────────────────────────────────────────────────

  /**
   * Cierra la sesión revocando todos los refresh tokens activos del usuario.
   * El access token sigue válido hasta su expiración (comportamiento estándar JWT).
   *
   * Requiere JWT válido.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request & { user: { id: number } }) {
    await this.authService.logout(req.user.id);
    return { message: 'Sesión cerrada correctamente.' };
  }

  // ── GET /auth/me ───────────────────────────────────────────────────────────

  /**
   * Retorna el perfil completo del usuario autenticado.
   * Usado por el frontend al iniciar para cargar el estado de sesión.
   *
   * Requiere JWT válido.
   */
  @Get('me')
  async getMe(@Req() req: Request & { user: { id: number } }) {
    const usuario = await this.authService.findByIdWithRolesAndPermisos(
      req.user.id,
    );

    if (!usuario) {
      throw new UnauthorizedException({
        code: 'USUARIO_NO_ENCONTRADO',
        message: 'El usuario no existe o fue eliminado.',
      });
    }

    const result = {
      id: usuario.id,
      email: usuario.email,
      nombreCompleto: usuario.nombreCompleto,
      activo: usuario.activo,
      debeCambiarPassword: usuario.debeCambiarPassword,
      ultimoLogin: usuario.ultimoLogin ?? null,
      roles: usuario.roles.map((ur) => ({ id: ur.rolId, nombre: ur.rol?.nombre ?? 'UNKNOWN' })),
    };
    
    const roleNames = result.roles.map(r => r.nombre);
    const isAdmin = roleNames.includes(RolNombre.ADMIN_GLOBAL) || roleNames.includes(RolNombre.ADMIN_HSE) || roleNames.includes(RolNombre.ADMIN_GH);

    return {
      ...result,
      sedeAsignadaId: isAdmin ? null : (usuario.sedeAsignadaId ?? null),
      sedeAsignada: isAdmin ? null : (usuario.sedeAsignada
        ? { id: usuario.sedeAsignada.id, nombre: usuario.sedeAsignada.nombre }
        : null),
      perfil: usuario.perfil
        ? {
            fotoPerfil: usuario.perfil.fotoPerfil ?? null,
            biografia: usuario.perfil.biografia ?? null,
            telefono: usuario.perfil.telefono ?? null,
            tema: usuario.perfil.tema,
            notificacionesEmail: usuario.perfil.notificacionesEmail,
          }
        : null,
      permisos: usuario.permisos
        ? {
            puedeVer: usuario.permisos.puedeVer,
            puedeCrear: usuario.permisos.puedeCrear,
            puedeEditar: usuario.permisos.puedeEditar,
            puedeEliminar: usuario.permisos.puedeEliminar,
          }
        : null,
    };
  }

  // ── POST /auth/change-password ─────────────────────────────────────────────

  /**
   * Cambia la contraseña del usuario autenticado.
   * Invalida todas las sesiones activas al completar.
   *
   * Requiere JWT válido.
   */
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() req: Request & { user: { id: number } },
  ) {
    await this.authService.changePassword(req.user.id, dto);
    return { message: 'Contraseña actualizada correctamente. Vuelve a iniciar sesión.' };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.socket?.remoteAddress ?? 'unknown';
  }
}
