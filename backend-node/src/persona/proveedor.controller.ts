import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolNombre } from '../common/enums/rol.enum';
import { ProveedorService } from './proveedor.service';
import { CreateProveedorDto, UpdateProveedorDto } from './dto/proveedor.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('proveedores')
export class ProveedorController {
  constructor(private readonly proveedorService: ProveedorService) {}

  @Get()
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE, RolNombre.VISUALIZADOR, RolNombre.ADMIN_GLOBAL)
  async getAll(@Query('search') search?: string) {
    return this.proveedorService.findAll(search);
  }

  @Get(':id')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE, RolNombre.VISUALIZADOR, RolNombre.ADMIN_GLOBAL)
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.proveedorService.findOne(id);
  }

  @Post()
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE, RolNombre.ADMIN_GLOBAL)
  async create(@Body() dto: CreateProveedorDto) {
    return this.proveedorService.create(dto);
  }

  @Put(':id')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE, RolNombre.ADMIN_GLOBAL)
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProveedorDto) {
    return this.proveedorService.update(id, dto);
  }

  @Delete(':id')
  @Roles(RolNombre.ADMIN_HSE, RolNombre.ADMIN_GLOBAL)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.proveedorService.remove(id);
  }
}
