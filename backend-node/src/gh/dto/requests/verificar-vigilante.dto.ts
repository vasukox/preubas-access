import { IsInt, IsString, MinLength, MaxLength, Min } from 'class-validator';

export class VerificarVigilanteDto {
  @IsInt()
  @Min(1)
  sedeId: number;

  @IsString()
  @MinLength(2)
  @MaxLength(20)
  tipoDocumento: string;

  @IsString()
  @MinLength(3)
  @MaxLength(30)
  numeroDocumento: string;
}
