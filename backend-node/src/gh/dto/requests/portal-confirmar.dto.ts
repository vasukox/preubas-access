import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class PortalConfirmarDto {
  @IsBoolean()
  confirmada: boolean;

  @IsOptional()
  @IsString()
  comentario?: string;
}
