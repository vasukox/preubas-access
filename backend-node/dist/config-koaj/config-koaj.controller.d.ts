import { ConfigKoajService } from './config-koaj.service';
import { CreateSedeDto, UpdateSedeDto, CreateUbicacionDto, UpdateUbicacionDto, CreateCatalogoDto, UpdateCatalogoDto, CreateNormaDto, UpdateNormaDto } from './dto/config-koaj.dto';
export declare class ConfigKoajController {
    private readonly configService;
    constructor(configService: ConfigKoajService);
    getSistema(): {
        access_token_expire_minutes: number;
        refresh_token_expire_days: number;
        max_upload_size_mb: number;
        allowed_origins: string[];
        debug: boolean;
        environment: string;
    };
    listarSedes(): Promise<import("../sede/entities/sede.entity").Sede[]>;
    getSede(id: number): Promise<import("../sede/entities/sede.entity").Sede>;
    crearSede(dto: CreateSedeDto): Promise<import("../sede/entities/sede.entity").Sede>;
    actualizarSede(id: number, dto: UpdateSedeDto): Promise<import("../sede/entities/sede.entity").Sede>;
    listarUbicaciones(sedeId: number): Promise<import("../sede/entities/ubicacion.entity").Ubicacion[]>;
    crearUbicacion(dto: CreateUbicacionDto): Promise<import("../sede/entities/ubicacion.entity").Ubicacion>;
    actualizarUbicacion(id: number, dto: UpdateUbicacionDto): Promise<import("../sede/entities/ubicacion.entity").Ubicacion>;
    eliminarUbicacion(id: number): Promise<void>;
    listarCatalogo(tipo: string): Promise<(import("../hse/entities/cat-arl.entity").CatArl | import("../hse/entities/cat-afp.entity").CatAfp | import("../hse/entities/cat-eps.entity").CatEps)[]>;
    crearItemCatalogo(tipo: string, dto: CreateCatalogoDto): Promise<import("../hse/entities/cat-arl.entity").CatArl | import("../hse/entities/cat-afp.entity").CatAfp | import("../hse/entities/cat-eps.entity").CatEps>;
    actualizarItemCatalogo(tipo: string, id: number, dto: UpdateCatalogoDto): Promise<import("../hse/entities/cat-arl.entity").CatArl | import("../hse/entities/cat-afp.entity").CatAfp | import("../hse/entities/cat-eps.entity").CatEps>;
    eliminarItemCatalogo(tipo: string, id: number): Promise<void>;
    listarNormas(sedeId?: string): Promise<import("../hse/entities/cat-norma-seguridad.entity").CatNormaSeguridad[]>;
    crearNorma(dto: CreateNormaDto): Promise<import("../hse/entities/cat-norma-seguridad.entity").CatNormaSeguridad>;
    actualizarNorma(id: number, dto: UpdateNormaDto): Promise<import("../hse/entities/cat-norma-seguridad.entity").CatNormaSeguridad>;
    eliminarNorma(id: number): Promise<void>;
}
