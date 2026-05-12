import { IsString, IsOptional, Length, IsEmail } from 'class-validator';

export class GhCandidatoBaseDto {
  @IsString()
  @Length(2, 20)
  tipoDocumento: string;

  @IsString()
  @Length(3, 30)
  numeroDocumento: string;

  @IsString()
  @Length(2, 120)
  nombres: string;

  @IsString()
  @Length(2, 120)
  apellidos: string;

  @IsOptional()
  @IsEmail()
  @Length(1, 150)
  email?: string;

  @IsOptional()
  @IsString()
  @Length(1, 30)
  telefono?: string;
}
