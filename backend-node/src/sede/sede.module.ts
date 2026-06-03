import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sede } from './entities/sede.entity';
import { Ubicacion } from './entities/ubicacion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sede, Ubicacion])],
  exports: [TypeOrmModule],
})
export class SedeModule {}
