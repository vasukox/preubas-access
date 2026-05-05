import { HseService } from './hse.service';
export declare class HseController {
    private readonly hseService;
    constructor(hseService: HseService);
    getSedes(req: any): Promise<import("../sede/entities/sede.entity").Sede[]>;
    getEps(): Promise<import("./entities/cat-eps.entity").CatEps[]>;
    getProveedores(): Promise<never[]>;
    getAutorizaciones(sedeId: number, estado?: string, page?: string, perPage?: string): Promise<any>;
    getDashboard(sedeId: number): Promise<any>;
}
