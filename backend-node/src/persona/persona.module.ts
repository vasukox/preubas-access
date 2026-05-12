import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Persona } from './entities/persona.entity';
import { Proveedor } from './entities/proveedor.entity';
import { ProveedorService } from './proveedor.service';
import { ProveedorController } from './proveedor.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Persona, Proveedor])],
  controllers: [ProveedorController],
  providers: [ProveedorService],
  exports: [TypeOrmModule, ProveedorService],
})
export class PersonaModule {}
