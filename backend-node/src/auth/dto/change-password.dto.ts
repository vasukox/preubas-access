import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

/**
 * Body para POST /auth/change-password
 *
 * El frontend envía { password_actual, password_nueva } en snake_case.
 */
export class ChangePasswordDto {
  @IsString()
  @MinLength(1, { message: 'La contraseña actual es requerida.' })
  password_actual: string;

  @IsString()
  @MinLength(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres.' })
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'La contraseña debe contener al menos una mayúscula, una minúscula y un número.',
  })
  password_nueva: string;
}
