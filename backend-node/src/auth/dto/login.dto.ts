import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

/**
 * Body para POST /auth/login
 */
export class LoginDto {
  @IsEmail({}, { message: 'El email no tiene un formato válido.' })
  @MaxLength(150)
  email: string;

  @IsString()
  @MinLength(1, { message: 'La contraseña es requerida.' })
  @MaxLength(128)
  password: string;
}
