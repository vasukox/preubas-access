import { IsString, IsInt, IsEnum, IsOptional } from 'class-validator';

export class VerificarAccesoDto {
  @IsString()
  numero_documento: string;

  @IsInt()
  sede_id: number;
}

export class RegistrarEntradaSalidaDto {
  @IsInt()
  contratista_id: number;

  @IsInt()
  sede_id: number;

  @IsOptional()
  @IsString()
  metodo?: string;

  @IsOptional()
  @IsString()
  observacion?: string;

  @IsOptional()
  @IsInt()
  ubicacion_id?: number;
}

export class RegistrarAccesoDto {
  @IsInt()
  contratista_id: number;

  @IsInt()
  sede_id: number;

  @IsEnum(['ENTRADA', 'SALIDA'])
  tipo: 'ENTRADA' | 'SALIDA';

  @IsOptional()
  @IsString()
  metodo?: string;

  @IsOptional()
  @IsInt()
  ubicacion_id?: number;

  @IsOptional()
  @IsString()
  observacion?: string;
}
