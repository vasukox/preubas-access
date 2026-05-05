import { IsString, IsNotEmpty } from 'class-validator';

export class AsignarRolDto {
  @IsString()
  @IsNotEmpty()
  rolNombre: string;
}
