import { IsOptional, IsInt, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class ReporteAccesosQueryDto {
  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined ? parseInt(value, 10) : undefined,
  )
  @IsInt()
  sede_id?: number;

  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined ? parseInt(value, 10) : undefined,
  )
  @IsInt()
  contratista_id?: number;

  @IsOptional()
  @IsString()
  fecha_inicio?: string;

  @IsOptional()
  @IsString()
  fecha_fin?: string;
}

export class ReporteCumplimientoQueryDto {
  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined ? parseInt(value, 10) : undefined,
  )
  @IsInt()
  sede_id?: number;

  @IsOptional()
  @IsString()
  fecha_inicio?: string;

  @IsOptional()
  @IsString()
  fecha_fin?: string;

  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined ? parseInt(value, 10) : undefined,
  )
  @IsInt()
  page?: number;

  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined ? parseInt(value, 10) : undefined,
  )
  @IsInt()
  limit?: number;
}

export class ReporteChartsQueryDto {
  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined ? parseInt(value, 10) : undefined,
  )
  @IsInt()
  sede_id?: number;
}

export class ReporteAutorizacionesQueryDto {
  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined ? parseInt(value, 10) : undefined,
  )
  @IsInt()
  sede_id?: number;

  @IsOptional()
  @IsString()
  fecha_inicio?: string;

  @IsOptional()
  @IsString()
  fecha_fin?: string;

  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  @IsString()
  tipo_contratista?: string;

  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined ? parseInt(value, 10) : undefined,
  )
  @IsInt()
  page?: number;

  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined ? parseInt(value, 10) : undefined,
  )
  @IsInt()
  limit?: number;
}

export class ReporteContratistasQueryDto {
  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined ? parseInt(value, 10) : undefined,
  )
  @IsInt()
  sede_id?: number;

  @IsOptional()
  @IsString()
  fecha_inicio?: string;

  @IsOptional()
  @IsString()
  fecha_fin?: string;

  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined ? parseInt(value, 10) : undefined,
  )
  @IsInt()
  page?: number;

  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined ? parseInt(value, 10) : undefined,
  )
  @IsInt()
  limit?: number;
}
