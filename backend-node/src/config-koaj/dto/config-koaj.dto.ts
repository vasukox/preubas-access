import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  MaxLength,
  Min,
} from 'class-validator';

// ─────────────────────────────────────────────────────────────────────────────
// SEDES
// ─────────────────────────────────────────────────────────────────────────────

export class CreateSedeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  codigo?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  ciudad?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  direccion?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  telefono?: string;

  @IsBoolean()
  @IsOptional()
  activa?: boolean;

  @IsInt()
  @IsOptional()
  @Min(0)
  capacidadCarros?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  capacidadMotos?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  capacidadBicis?: number;

  @IsBoolean()
  @IsOptional()
  aplicaPicoPlaca?: boolean;

  @IsString()
  @IsOptional()
  notas?: string;
}

export class UpdateSedeDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nombre?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  codigo?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  ciudad?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  direccion?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  telefono?: string;

  @IsBoolean()
  @IsOptional()
  activa?: boolean;

  @IsInt()
  @IsOptional()
  @Min(0)
  capacidadCarros?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  capacidadMotos?: number;

  @IsInt()
  @IsOptional() 
  @Min(0)
  capacidadBicis?: number;

  @IsBoolean()
  @IsOptional()
  aplicaPicoPlaca?: boolean;

  @IsString()
  @IsOptional()
  notas?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// UBICACIONES
// ─────────────────────────────────────────────────────────────────────────────

export class CreateUbicacionDto {
  @IsInt()
  @IsNotEmpty()
  sedeId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  codigo?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  tipo?: string;

  @IsBoolean()
  @IsOptional()
  activa?: boolean;

  @IsString()
  @IsOptional()
  descripcion?: string;
}

export class UpdateUbicacionDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nombre?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  codigo?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  tipo?: string;

  @IsBoolean()
  @IsOptional()
  activa?: boolean;

  @IsString()
  @IsOptional()
  descripcion?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CATÁLOGOS (EPS / ARL / AFP)
// ─────────────────────────────────────────────────────────────────────────────

export class CreateCatalogoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  codigo: string;

  @IsBoolean()
  @IsOptional()
  activa?: boolean;
}

export class UpdateCatalogoDto {
  @IsString()
  @IsOptional()
  @MaxLength(150)
  nombre?: string;

  @IsBoolean()
  @IsOptional()
  activa?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// NORMAS DE SEGURIDAD
// ─────────────────────────────────────────────────────────────────────────────

export class CreateNormaDto {
  @IsInt()
  @IsNotEmpty()
  numero: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  titulo: string;

  @IsString()
  @IsNotEmpty()
  contenido: string;

  @IsBoolean()
  @IsOptional()
  activa?: boolean;

  @IsInt()
  @IsOptional()
  sedeId?: number; // NULL = aplica a todas las sedes
}

export class UpdateNormaDto {
  @IsInt()
  @IsOptional()
  numero?: number;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  titulo?: string;

  @IsString()
  @IsOptional()
  contenido?: string;

  @IsBoolean()
  @IsOptional()
  activa?: boolean;

  @IsInt()
  @IsOptional()
  sedeId?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// TIEMPOS POR TIPO DE CONTRATISTA
// ─────────────────────────────────────────────────────────────────────────────

export class UpdateTiemposContratistaDto {
  @IsInt()
  @IsOptional()
  @Min(1)
  tokenDuracionHoras?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  autorizacionDuracionDias?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  alertaVencimientoDias?: number;

  @IsBoolean()
  @IsOptional()
  requiereExamenMedico?: boolean;

  @IsBoolean()
  @IsOptional()
  requiereSeguridadSocial?: boolean;
}
