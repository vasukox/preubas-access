import { IsString, IsNotEmpty, IsOptional, IsInt, IsArray, ArrayMinSize } from 'class-validator';

export class AsignarRolDto {
  @IsString()
  @IsNotEmpty()
  rolNombre: string;

  @IsOptional()
  @IsInt()
  sedeAsignadaId?: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  sedesAsignadasIds?: number[];
}
