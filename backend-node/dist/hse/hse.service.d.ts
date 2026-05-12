import { Repository } from 'typeorm';
import { Sede } from '../sede/entities/sede.entity';
import { CatEps } from './entities/cat-eps.entity';
import { CatArl } from './entities/cat-arl.entity';
import { CatAfp } from './entities/cat-afp.entity';
import { CatNormaSeguridad } from './entities/cat-norma-seguridad.entity';
import { HseAutorizacion } from './entities/hse-autorizacion.entity';
import { HseContratista } from './entities/hse-contratista.entity';
import { HseAcceso } from './entities/hse-acceso.entity';
import { AccesoService } from './services/acceso.service';
export declare class HseService {
    private readonly sedeRepo;
    private readonly epsRepo;
    private readonly arlRepo;
    private readonly afpRepo;
    private readonly normaRepo;
    private readonly autorizacionRepo;
    private readonly contratistaRepo;
    private readonly accesoRepo;
    private readonly accesoService;
    constructor(sedeRepo: Repository<Sede>, epsRepo: Repository<CatEps>, arlRepo: Repository<CatArl>, afpRepo: Repository<CatAfp>, normaRepo: Repository<CatNormaSeguridad>, autorizacionRepo: Repository<HseAutorizacion>, contratistaRepo: Repository<HseContratista>, accesoRepo: Repository<HseAcceso>, accesoService: AccesoService);
    getCatalogosSedes(usuario: any): Promise<Sede[]>;
    getCatalogosEps(): Promise<CatEps[]>;
    getCatalogosArl(): Promise<CatArl[]>;
    getCatalogosAfp(): Promise<CatAfp[]>;
    getCatalogosNormas(sedeId: number): Promise<CatNormaSeguridad[]>;
    getDashboard(sedeId: number): Promise<any>;
}
