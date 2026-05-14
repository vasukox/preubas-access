import { IsString, IsInt, IsEnum, IsOptional } from 'class-validator';

export class VerificarAccesoDto {
  @IsString()
  numeroDocumento: string;

  @IsInt()
  sedeId: number;
}

export class RegistrarEntradaSalidaDto {
  @IsInt()
  contratistaId: number;

  @IsInt()
  sedeId: number;

  @IsOptional()
  @IsString()
  metodo?: string;

  @IsOptional()
  @IsString()
  observacion?: string;

  @IsOptional()
  @IsInt()
  ubicacionId?: number;
}

export class RegistrarAccesoDto {
  @IsInt()
  contratistaId: number;

  @IsInt()
  sedeId: number;

  @IsEnum(['ENTRADA', 'SALIDA'])
  tipo: 'ENTRADA' | 'SALIDA';

  @IsOptional()
  @IsString()
  metodo?: string;

  @IsOptional()
  @IsInt()
  ubicacionId?: number;

  @IsOptional()
  @IsString()
  observacion?: string;
}
