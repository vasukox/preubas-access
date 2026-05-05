import { IsString, MinLength } from 'class-validator';

/**
 * Body para POST /auth/refresh
 *
 * El frontend envía { refresh_token: "..." } en snake_case.
 */
export class RefreshTokenDto {
  @IsString()
  @MinLength(1, { message: 'El refresh token es requerido.' })
  refresh_token: string;
}
