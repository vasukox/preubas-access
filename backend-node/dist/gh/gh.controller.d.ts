import { GhService } from './gh.service';
import { CrearCitaDto } from './dto/requests/crear-cita.dto';
import { CrearCitaGrupoDto } from './dto/requests/crear-cita-grupo.dto';
import { ActualizarCitaDto } from './dto/requests/actualizar-cita.dto';
import { CambiarEstadoCitaDto } from './dto/requests/cambiar-estado-cita.dto';
import { PortalConfirmarDto } from './dto/requests/portal-confirmar.dto';
import { PortalReagendarDto } from './dto/requests/portal-reagendar.dto';
import { CrearSesionInduccionDto } from './dto/requests/crear-sesion-induccion.dto';
import { EstadoSesionInduccionDto } from './dto/requests/estado-sesion-induccion.dto';
import { PortalInduccionCodigoDto } from './dto/requests/portal-induccion.dto';
import { CrearMaestroDotacionDto } from './dto/requests/crear-maestro-dotacion.dto';
import { CrearDotacionEntregaDto } from './dto/requests/crear-dotacion-entrega.dto';
import { AgregarDetalleEntregaDto } from './dto/requests/agregar-detalle-entrega.dto';
import { CrearImportacionDto } from './dto/requests/crear-importacion.dto';
import { VerificarVigilanteDto } from './dto/requests/verificar-vigilante.dto';
export declare class GhController {
    private readonly ghService;
    constructor(ghService: GhService);
    listTiposCita(): Promise<{
        id: string;
        nombre: string;
    }[]>;
    listEstadosCita(): Promise<{
        id: string;
        nombre: string;
    }[]>;
    getCitas(sedeId: number, estado?: string, tipoCita?: string, busqueda?: string, fechaDesde?: string, fechaHasta?: string, page?: string, perPage?: string): Promise<import("./dto/responses/cita-response.dto").CitaResponseDto[]>;
    getCita(id: number): Promise<import("./dto/responses/cita-response.dto").CitaResponseDto>;
    crearCita(body: CrearCitaDto, req: any): Promise<import("./dto/responses/cita-response.dto").CitaResponseDto>;
    crearCitasGrupo(body: CrearCitaGrupoDto, req: any): Promise<import("./dto/responses/cita-response.dto").CitaResponseDto[]>;
    actualizarCita(id: number, body: ActualizarCitaDto, req: any): Promise<import("./dto/responses/cita-response.dto").CitaResponseDto>;
    cambiarEstadoPost(id: number, body: CambiarEstadoCitaDto, req: any): Promise<import("./dto/responses/cita-response.dto").CitaResponseDto>;
    cambiarEstadoPatch(id: number, body: CambiarEstadoCitaDto, req: any): Promise<import("./dto/responses/cita-response.dto").CitaResponseDto>;
    eliminarCita(id: number, req: any): Promise<{
        success: boolean;
    }>;
    validarTokenPortal(token: string): Promise<import("./dto/responses/portal-response.dto").PortalValidateResponseDto>;
    portalConfirmar(token: string, body: PortalConfirmarDto): Promise<import("./dto/responses/portal-response.dto").PortalAccionResponseDto>;
    portalReagendar(token: string, body: PortalReagendarDto): Promise<import("./dto/responses/portal-response.dto").PortalAccionResponseDto>;
    validarTokenPortalInduccion(token: string): Promise<import("./dto/responses/portal-induccion-response.dto").PortalInduccionValidateResponseDto>;
    portalInduccionCheckin(token: string, body: PortalInduccionCodigoDto, req: any): Promise<import("./dto/responses/portal-induccion-response.dto").PortalInduccionAccionResponseDto>;
    portalInduccionCheckout(token: string, body: PortalInduccionCodigoDto, req: any): Promise<import("./dto/responses/portal-induccion-response.dto").PortalInduccionAccionResponseDto>;
    getDashboard(sedeId: number): Promise<{
        citasHoyTotal: number;
        citasHoyConfirmadas: number;
        citasHoyNoAsistio: number;
        citasEnCurso: number;
    }>;
    crearSesionInduccion(body: CrearSesionInduccionDto, req: any): Promise<import("./dto/responses/sesion-induccion-response.dto").SesionInduccionResponseDto>;
    getInduccionesSesiones(sedeId?: string, estadoSesion?: string): Promise<import("./dto/responses/sesion-induccion-response.dto").SesionInduccionResponseDto[]>;
    getSesionInduccion(id: number): Promise<import("./dto/responses/sesion-induccion-response.dto").SesionInduccionResponseDto>;
    cambiarEstadoSesionInduccion(id: number, body: EstadoSesionInduccionDto, req: any): Promise<import("./dto/responses/sesion-induccion-response.dto").SesionInduccionResponseDto>;
    generarCodigoCheckin(id: number, req: any): Promise<import("./dto/responses/sesion-induccion-response.dto").CodigoTemporalResponseDto>;
    generarCodigoCheckout(id: number, req: any): Promise<import("./dto/responses/sesion-induccion-response.dto").CodigoTemporalResponseDto>;
    enviarLinksInduccion(id: number, req: any): Promise<{
        enviados: number;
        mensaje: string;
    }>;
    verificarVigilante(body: VerificarVigilanteDto, req: any): Promise<{
        estado: string;
        mensaje: string;
        cita: null;
    } | {
        estado: string;
        mensaje: string;
        cita: import("./dto/responses/cita-response.dto").CitaResponseDto;
    }>;
    crearImportacion(body: CrearImportacionDto, req: any): Promise<import("./dto/responses/dotacion-response.dto").ImportacionResponseDto>;
    getImportacion(id: number): Promise<import("./dto/responses/dotacion-response.dto").ImportacionDetalleResponseDto>;
    getDotacionMaestro(sedeId?: string, area?: string, cargo?: string, tipoContrato?: string, activosOnly?: string): Promise<import("./dto/responses/dotacion-response.dto").MaestroDotacionResponseDto[]>;
    crearMaestroDotacion(body: CrearMaestroDotacionDto, req: any): Promise<import("./dto/responses/dotacion-response.dto").MaestroDotacionResponseDto>;
    buscarCandidatos(q?: string, sedeId?: string): Promise<import("./dto/responses/candidato-response.dto").CandidatoResponseDto[]>;
    getDotacionEntregas(estado?: string, sedeId?: string): Promise<import("./dto/responses/dotacion-response.dto").DotacionEntregaResponseDto[]>;
    crearEntregaDotacion(body: CrearDotacionEntregaDto, req: any): Promise<import("./dto/responses/dotacion-response.dto").DotacionEntregaResponseDto>;
    agregarDetalleEntrega(id: number, body: AgregarDetalleEntregaDto, req: any): Promise<import("./dto/responses/dotacion-response.dto").DotacionEntregaResponseDto>;
    cerrarEntrega(id: number, req: any): Promise<import("./dto/responses/dotacion-response.dto").DotacionEntregaResponseDto>;
}
