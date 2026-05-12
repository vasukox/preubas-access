import { IsString, Length } from 'class-validator';

export class PortalInduccionCodigoDto {
  @IsString()
  @Length(4, 10)
  codigo: string;
}
