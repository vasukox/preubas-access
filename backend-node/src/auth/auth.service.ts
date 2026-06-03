import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import { Usuario } from './entities/usuario.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { AuditLog } from './entities/audit-log.entity';
import { ConfigService } from '../config/config.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RolNombre } from '../common/enums/rol.enum';

// ── Constantes de seguridad ─────────────────────────────────────────────────
const MAX_INTENTOS_FALLIDOS = 5;
const MINUTOS_BLOQUEO = 15;

// ── Interfaces de respuesta ──────────────────────────────────────────────────

/** Par de tokens internos — usado en refresh y como base del login */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: 'bearer';
  expiresIn: number;
}

/** Estructura exacta que espera el frontend en POST /auth/login */
export interface LoginResponse {
  tokens: {
    accessToken: string;
    refreshToken: string;
    tokenType: 'bearer';
    debeCambiarPassword: boolean;
  };
  usuario: {
    id: number;
    email: string;
    nombreCompleto: string;
    activo: boolean;
    debeCambiarPassword: boolean;
    ultimoLogin: Date | null;
    roles: { id: number; nombre: string }[];
    sedeAsignadaId: number | null;
    sedeAsignada: { id: number; nombre: string; ciudad?: string } | null;
    sedesAsignadasIds: number[];
    sedesAsignadas: { id: number; nombre: string; ciudad?: string }[];
  };
}

/**
 * AuthService — lógica completa de autenticación.
 *
 * Equivalente a `AuthService` en Python (app/services/auth_service.py).
 *
 * Endpoints que sirve:
 *   POST /auth/login           → login con email/password
 *   POST /auth/refresh         → rotar refresh token
 *   POST /auth/logout          → revocar todos los tokens
 *   GET  /auth/me              → perfil del usuario actual
 *   POST /auth/change-password → cambiar contraseña
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,

    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,

    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,

    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ── LOGIN ──────────────────────────────────────────────────────────────────

  /**
   * Valida credenciales y emite par de tokens (access + refresh).
   *
   * Lógica de seguridad:
   *  - Si el usuario está bloqueado → error con tiempo restante
   *  - Si la contraseña es incorrecta → incrementa intentos fallidos
   *  - Al 5° intento fallido → bloquea 15 minutos
   *  - Login exitoso → resetea intentos, guarda ultimo_login
   */
  async login(
    dto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<LoginResponse> {
    // 1. Buscar usuario activo por email
    const usuario = await this.findUsuarioConRelaciones({
      email: dto.email.toLowerCase().trim(),
    });

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException({
        code: 'CREDENCIALES_INVALIDAS',
        message: 'Email o contraseña incorrectos.',
      });
    }

    // 2. Verificar si está bloqueado
    if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
      const minutosRestantes = Math.ceil(
        (usuario.bloqueadoHasta.getTime() - Date.now()) / 60000,
      );
      throw new UnauthorizedException({
        code: 'CUENTA_BLOQUEADA',
        message: `Cuenta bloqueada por ${minutosRestantes} minuto(s) por demasiados intentos fallidos.`,
      });
    }

    // 3. Verificar contraseña
    const passwordValida = await bcrypt.compare(
      dto.password,
      usuario.passwordHash,
    );

    if (!passwordValida) {
      await this.registrarIntentoFallido(usuario);
      throw new UnauthorizedException({
        code: 'CREDENCIALES_INVALIDAS',
        message: 'Email o contraseña incorrectos.',
      });
    }

    // 4. Login exitoso — resetear intentos y actualizar último login
    await this.usuarioRepo.update(usuario.id, {
      intentosFallidos: 0,
      bloqueadoHasta: null,
      ultimoLogin: new Date(),
    });

    // 5. Generar tokens
    const roleObjs = usuario.roles.map((ur) => ({
      id: ur.rolId,
      nombre: ur.rol?.nombre ?? 'UNKNOWN',
    }));
    const roleNames = roleObjs.map((r) => r.nombre);
    const tokens = await this.generarTokens(
      usuario,
      roleNames,
      ipAddress,
      userAgent,
    );

    // 6. Audit log
    await this.registrarAudit(
      usuario.id,
      usuario.nombreCompleto,
      'LOGIN',
      'usuario',
      usuario.id,
    );

    this.logger.log(
      `Login exitoso: ${usuario.email} desde ${ipAddress ?? 'IP desconocida'}`,
    );

    // 7. Retornar estructura exacta que espera el frontend
    // Si es ADMIN, no enviamos la sede fija para que el frontend no lo bloquee en el selector
    const isAdmin =
      roleNames.includes(RolNombre.ADMIN_GLOBAL) ||
      roleNames.includes(RolNombre.ADMIN_HSE) ||
      roleNames.includes(RolNombre.ADMIN_GH);

    const sedesAsignadas = isAdmin
      ? []
      : (usuario.sedesAsignadas ?? [])
          .filter((us) => us.sede)
          .map((us) => ({
            id: us.sede.id,
            nombre: us.sede.nombre,
            ciudad: us.sede.ciudad,
          }));

    const sedesFallback =
      !isAdmin && sedesAsignadas.length === 0 && usuario.sedeAsignada
        ? [
            {
              id: usuario.sedeAsignada.id,
              nombre: usuario.sedeAsignada.nombre,
              ciudad: usuario.sedeAsignada.ciudad,
            },
          ]
        : [];

    const sedesFinales =
      sedesAsignadas.length > 0 ? sedesAsignadas : sedesFallback;
    const sedePrincipal = sedesFinales[0] ?? null;

    return {
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenType: 'bearer',
        debeCambiarPassword: usuario.debeCambiarPassword,
      },
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombreCompleto: usuario.nombreCompleto,
        activo: usuario.activo,
        debeCambiarPassword: usuario.debeCambiarPassword,
        ultimoLogin: usuario.ultimoLogin ?? null,
        roles: roleObjs,
        sedeAsignadaId: isAdmin
          ? null
          : (usuario.sedeAsignadaId ?? sedePrincipal?.id ?? null),
        sedeAsignada: isAdmin
          ? null
          : sedePrincipal
            ? { id: sedePrincipal.id, nombre: sedePrincipal.nombre }
            : null,
        sedesAsignadasIds: isAdmin ? [] : sedesFinales.map((s) => s.id),
        sedesAsignadas: isAdmin ? [] : sedesFinales,
      },
    };
  }

  // ── REFRESH TOKEN ──────────────────────────────────────────────────────────

  /**
   * Valida un refresh token y emite un nuevo par de tokens.
   * El token usado queda revocado (rotación one-time).
   */
  async refreshTokens(
    rawRefreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TokenPair> {
    // 1. Decodificar el JWT de refresh
    let payload: { sub: number; jti: string; type: string };
    try {
      payload = this.jwtService.verify(rawRefreshToken, {
        secret: this.configService.jwtSecret,
      });
    } catch {
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_INVALIDO',
        message: 'El refresh token es inválido o ha expirado.',
      });
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_INVALIDO',
        message: 'El token proporcionado no es un refresh token.',
      });
    }

    // 2. Buscar el registro del refresh token en BD
    const tokenEntity = await this.refreshTokenRepo.findOne({
      where: { jti: payload.jti, revocado: false },
      relations: [
        'usuario',
        'usuario.roles',
        'usuario.roles.rol',
        'usuario.perfil',
      ],
    });

    if (!tokenEntity || tokenEntity.expiraEn < new Date()) {
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_INVALIDO',
        message: 'El refresh token no es válido o ya fue utilizado.',
      });
    }

    const usuario = tokenEntity.usuario;

    if (!usuario.activo) {
      throw new UnauthorizedException({
        code: 'USUARIO_INACTIVO',
        message: 'Tu cuenta ha sido desactivada.',
      });
    }

    // 3. Revocar el token actual (one-time use)
    await this.refreshTokenRepo.update(tokenEntity.id, { revocado: true });

    // 4. Emitir nuevo par de tokens
    const roles = usuario.roles.map((ur) => ur.rol.nombre);
    return this.generarTokens(usuario, roles, ipAddress, userAgent);
  }

  // ── LOGOUT ─────────────────────────────────────────────────────────────────

  /**
   * Revoca TODOS los refresh tokens activos del usuario.
   * Equivale a "cerrar sesión en todos los dispositivos".
   */
  async logout(usuarioId: number): Promise<void> {
    await this.refreshTokenRepo
      .createQueryBuilder()
      .update()
      .set({ revocado: true })
      .where('usuario_id = :usuarioId AND revocado = false', { usuarioId })
      .execute();

    this.logger.log(`Logout completo: usuario_id=${usuarioId}`);
  }

  // ── PERFIL (ME) ────────────────────────────────────────────────────────────

  /**
   * Retorna el perfil completo del usuario autenticado.
   * Usado por GET /auth/me.
   */
  async findByIdWithRolesAndPermisos(id: number): Promise<Usuario | null> {
    return this.findUsuarioConRelaciones({ id });
  }

  // ── CAMBIO DE CONTRASEÑA ───────────────────────────────────────────────────

  /**
   * Cambia la contraseña del usuario autenticado.
   * Invalida todos los refresh tokens activos al completar.
   */
  async changePassword(
    usuarioId: number,
    dto: ChangePasswordDto,
  ): Promise<void> {
    const usuario = await this.usuarioRepo.findOne({
      where: { id: usuarioId },
    });

    if (!usuario) {
      throw new UnauthorizedException({
        code: 'USUARIO_NO_ENCONTRADO',
        message: 'Usuario no encontrado.',
      });
    }

    // Verificar contraseña actual
    const esValida = await bcrypt.compare(
      dto.passwordActual,
      usuario.passwordHash,
    );
    if (!esValida) {
      throw new BadRequestException({
        code: 'PASSWORD_INCORRECTO',
        message: 'La contraseña actual es incorrecta.',
      });
    }

    // Verificar que la nueva no sea igual a la actual
    const esIgual = await bcrypt.compare(
      dto.passwordNueva,
      usuario.passwordHash,
    );
    if (esIgual) {
      throw new BadRequestException({
        code: 'PASSWORD_IGUAL',
        message: 'La nueva contraseña no puede ser igual a la actual.',
      });
    }

    // Hashear y guardar
    const nuevoHash = await bcrypt.hash(dto.passwordNueva, 12);
    await this.usuarioRepo.update(usuario.id, {
      passwordHash: nuevoHash,
      debeCambiarPassword: false,
    });

    // Revocar todos los refresh tokens (cierra otras sesiones)
    await this.logout(usuarioId);

    await this.registrarAudit(
      usuario.id,
      usuario.nombreCompleto,
      'CAMBIO_PASSWORD',
      'usuario',
      usuario.id,
    );

    this.logger.log(`Contraseña cambiada: usuario_id=${usuarioId}`);
  }

  // ── HELPERS PRIVADOS ───────────────────────────────────────────────────────

  /**
   * Genera un par access_token + refresh_token y persiste el refresh en BD.
   */
  private async generarTokens(
    usuario: Usuario,
    roles: string[],
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TokenPair> {
    const accessExpireSeconds = this.configService.jwtAccessExpireMinutes * 60;
    const refreshExpireDays = this.configService.jwtRefreshExpireDays;

    // Payload del access token
    const accessPayload = {
      sub: usuario.id,
      email: usuario.email,
      roles,
      dcp: usuario.debeCambiarPassword,
    };

    // JTI único para el refresh token (permite revocación individual)
    const jti = uuidv4();

    const accessToken = this.jwtService.sign(accessPayload, {
      expiresIn: accessExpireSeconds,
    });

    const refreshToken = this.jwtService.sign(
      { sub: usuario.id, jti, type: 'refresh' },
      { expiresIn: `${refreshExpireDays}d` },
    );

    // Persistir refresh token en BD
    const expiraEn = new Date();
    expiraEn.setDate(expiraEn.getDate() + refreshExpireDays);

    await this.refreshTokenRepo.save(
      this.refreshTokenRepo.create({
        usuarioId: usuario.id,
        jti,
        revocado: false,
        expiraEn,
        userAgent: userAgent ?? undefined,
        ipAddress: ipAddress ?? undefined,
      }),
    );

    return {
      accessToken,
      refreshToken,
      tokenType: 'bearer',
      expiresIn: accessExpireSeconds,
    };
  }

  private async findUsuarioConRelaciones(
    where: FindOptionsWhere<Usuario>,
  ): Promise<Usuario | null> {
    const relacionesBase = [
      'roles',
      'roles.rol',
      'perfil',
      'permisos',
      'sedeAsignada',
    ];
    const relacionesConSedes = [
      ...relacionesBase,
      'sedesAsignadas',
      'sedesAsignadas.sede',
    ];

    try {
      return await this.usuarioRepo.findOne({
        where,
        relations: relacionesConSedes,
      });
    } catch (error) {
      this.logger.warn(
        `No se pudo cargar usuario_sedes; usando sede_asignada_id como respaldo. ${(error as Error).message}`,
      );
      return this.usuarioRepo.findOne({
        where,
        relations: relacionesBase,
      });
    }
  }

  /**
   * Registra un intento fallido de login.
   * Al llegar al máximo, bloquea la cuenta por MINUTOS_BLOQUEO minutos.
   */
  private async registrarIntentoFallido(usuario: Usuario): Promise<void> {
    const nuevosIntentos = (usuario.intentosFallidos ?? 0) + 1;
    const update: Partial<Usuario> = { intentosFallidos: nuevosIntentos };

    if (nuevosIntentos >= MAX_INTENTOS_FALLIDOS) {
      const bloqueadoHasta = new Date();
      bloqueadoHasta.setMinutes(bloqueadoHasta.getMinutes() + MINUTOS_BLOQUEO);
      update.bloqueadoHasta = bloqueadoHasta;
      this.logger.warn(
        `Cuenta bloqueada: ${usuario.email} (${nuevosIntentos} intentos fallidos)`,
      );
    }

    await this.usuarioRepo.update(usuario.id, update);
  }

  /**
   * Persiste una entrada en audit_log.
   */
  private async registrarAudit(
    actorId: number,
    actorNombre: string,
    accion: string,
    entidad: string,
    entidadId: number,
    descripcion?: string,
  ): Promise<void> {
    await this.auditLogRepo.save(
      this.auditLogRepo.create({
        actorId,
        actorNombre,
        accion,
        entidad,
        entidadId,
        descripcion: descripcion ?? undefined,
      }),
    );
  }
}
