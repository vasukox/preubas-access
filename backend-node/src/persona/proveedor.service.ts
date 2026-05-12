import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Proveedor } from './entities/proveedor.entity';
import { CreateProveedorDto, UpdateProveedorDto } from './dto/proveedor.dto';

@Injectable()
export class ProveedorService {
  constructor(
    @InjectRepository(Proveedor)
    private readonly proveedorRepo: Repository<Proveedor>,
  ) {}

  async findAll(search?: string): Promise<Proveedor[]> {
    if (search) {
      return this.proveedorRepo.find({
        where: [
          { nomProveedor: ILike(`%${search}%`) },
          { nitProveedor: ILike(`%${search}%`) },
        ],
        order: { nomProveedor: 'ASC' },
      });
    }
    return this.proveedorRepo.find({ order: { nomProveedor: 'ASC' } });
  }

  async findActivos(): Promise<Proveedor[]> {
    return this.proveedorRepo.find({
      where: { estadoProv: true },
      order: { nomProveedor: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Proveedor> {
    const proveedor = await this.proveedorRepo.findOne({ where: { id } });
    if (!proveedor) {
      throw new NotFoundException(`Proveedor con ID ${id} no encontrado`);
    }
    return proveedor;
  }

  async create(dto: CreateProveedorDto): Promise<Proveedor> {
    const existe = await this.proveedorRepo.findOne({ where: { nitProveedor: dto.nitProveedor } });
    if (existe) {
      throw new ConflictException(`Ya existe un proveedor con NIT ${dto.nitProveedor}`);
    }
    const proveedor = this.proveedorRepo.create(dto);
    return this.proveedorRepo.save(proveedor);
  }

  async update(id: number, dto: UpdateProveedorDto): Promise<Proveedor> {
    const proveedor = await this.findOne(id);

    if (dto.nitProveedor && dto.nitProveedor !== proveedor.nitProveedor) {
      const existe = await this.proveedorRepo.findOne({ where: { nitProveedor: dto.nitProveedor } });
      if (existe) {
        throw new ConflictException(`Ya existe un proveedor con NIT ${dto.nitProveedor}`);
      }
    }

    Object.assign(proveedor, dto);
    return this.proveedorRepo.save(proveedor);
  }

  async remove(id: number): Promise<{ success: boolean; message: string }> {
    const proveedor = await this.findOne(id);
    await this.proveedorRepo.softRemove(proveedor);
    return { success: true, message: 'Proveedor eliminado correctamente' };
  }
}
