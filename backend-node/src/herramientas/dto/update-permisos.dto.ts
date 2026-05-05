import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePermisosDto {
  @IsOptional()
  @IsBoolean()
  puedeVer?: boolean;

  @IsOptional()
  @IsBoolean()
  puedeCrear?: boolean;

  @IsOptional()
  @IsBoolean()
  puedeEditar?: boolean;

  @IsOptional()
  @IsBoolean()
  puedeEliminar?: boolean;
}
