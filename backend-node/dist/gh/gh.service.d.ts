import { Repository } from 'typeorm';
import { GhCita } from './entities/gh-cita.entity';
export declare class GhService {
    private readonly citaRepo;
    constructor(citaRepo: Repository<GhCita>);
    getCitas(sedeId: number, estado?: string, tipoCita?: string, busqueda?: string, fechaDesde?: string, fechaHasta?: string, page?: number, perPage?: number): Promise<GhCita[]>;
}
