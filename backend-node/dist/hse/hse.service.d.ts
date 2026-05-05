import { Repository } from 'typeorm';
import { Sede } from '../sede/entities/sede.entity';
import { CatEps } from './entities/cat-eps.entity';
import { HseAutorizacion } from './entities/hse-autorizacion.entity';
export declare class HseService {
    private readonly sedeRepo;
    private readonly epsRepo;
    private readonly autorizacionRepo;
    constructor(sedeRepo: Repository<Sede>, epsRepo: Repository<CatEps>, autorizacionRepo: Repository<HseAutorizacion>);
    getCatalogosSedes(usuario: any): Promise<Sede[]>;
    getCatalogosEps(): Promise<CatEps[]>;
    getAutorizaciones(sedeId: number, estado?: string, page?: number, perPage?: number): Promise<any>;
    getDashboard(sedeId: number): Promise<any>;
}
