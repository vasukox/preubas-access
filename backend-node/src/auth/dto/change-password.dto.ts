import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

/**
 * Body para POST /auth/change-password
 *
 * El frontend envía snake_case; el SnakeToCamelPipe global lo convierte
 * a camelCase antes de llegar aquí.
 */
export class ChangePasswordDto {
  @IsString()
  @MinLength(1, { message: 'La contraseña actual es requerida.' })
  passwordActual: string;

  @IsString()
  @MinLength(8, {
    message: 'La nueva contraseña debe tener al menos 8 caracteres.',
  })
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'La contraseña debe contener al menos una mayúscula, una minúscula y un número.',
  })
  passwordNueva: string;
}
