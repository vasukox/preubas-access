import { IsString, IsNotEmpty } from 'class-validator';

export class AprobarArchivadoDto {
  @IsString()
  @IsNotEmpty()
  motivo: string;

  @IsString()
  @IsNotEmpty()
  firmaDigital: string;
}

export class RechazarArchivadoDto {
  @IsString()
  @IsNotEmpty()
  motivo: string;
}
