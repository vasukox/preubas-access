import { GhService } from './gh.service';
export declare class GhController {
    private readonly ghService;
    constructor(ghService: GhService);
    getCitas(sedeId: number, estado?: string, tipoCita?: string, busqueda?: string, fechaDesde?: string, fechaHasta?: string, page?: string, perPage?: string): Promise<import("./entities/gh-cita.entity").GhCita[]>;
}
