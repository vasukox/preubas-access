import { IsInt, IsString, MinLength, MaxLength, Min } from 'class-validator';

export class CrearImportacionDto {
  @IsInt()
  @Min(1)
  sedeId: number;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  nombreArchivo: string;
}
