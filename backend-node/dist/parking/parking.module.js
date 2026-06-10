"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParkingModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const parking_solicitud_entity_1 = require("./entities/parking-solicitud.entity");
const parking_vehiculo_entity_1 = require("./entities/parking-vehiculo.entity");
const parking_autorizacion_entity_1 = require("./entities/parking-autorizacion.entity");
const parking_documento_entity_1 = require("./entities/parking-documento.entity");
const parking_zona_entity_1 = require("./entities/parking-zona.entity");
const parking_cupo_entity_1 = require("./entities/parking-cupo.entity");
const parking_asignacion_cupo_entity_1 = require("./entities/parking-asignacion-cupo.entity");
const parking_acceso_entity_1 = require("./entities/parking-acceso.entity");
const parking_novedad_entity_1 = require("./entities/parking-novedad.entity");
const parking_excepcion_entity_1 = require("./entities/parking-excepcion.entity");
const parking_historial_entity_1 = require("./entities/parking-historial.entity");
const parking_politica_sede_entity_1 = require("./entities/parking-politica-sede.entity");
const sede_entity_1 = require("../sede/entities/sede.entity");
const parking_token_guard_1 = require("./guards/parking-token.guard");
const dashboard_service_1 = require("./services/dashboard.service");
const codigo_generator_service_1 = require("./services/codigo-generator.service");
const catalogos_service_1 = require("./services/catalogos.service");
const solicitudes_service_1 = require("./services/solicitudes.service");
const autorizaciones_service_1 = require("./services/autorizaciones.service");
const vehiculos_service_1 = require("./services/vehiculos.service");
const zonas_service_1 = require("./services/zonas.service");
const vigilante_service_1 = require("./services/vigilante.service");
const novedades_service_1 = require("./services/novedades.service");
const excepciones_service_1 = require("./services/excepciones.service");
const accesos_service_1 = require("./services/accesos.service");
const reportes_service_1 = require("./services/reportes.service");
const configuracion_service_1 = require("./services/configuracion.service");
const parking_controller_1 = require("./parking.controller");
let ParkingModule = class ParkingModule {
};
exports.ParkingModule = ParkingModule;
exports.ParkingModule = ParkingModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                parking_solicitud_entity_1.ParkingSolicitud,
                parking_vehiculo_entity_1.ParkingVehiculo,
                parking_autorizacion_entity_1.ParkingAutorizacion,
                parking_documento_entity_1.ParkingDocumento,
                parking_zona_entity_1.ParkingZona,
                parking_cupo_entity_1.ParkingCupo,
                parking_asignacion_cupo_entity_1.ParkingAsignacionCupo,
                parking_acceso_entity_1.ParkingAcceso,
                parking_novedad_entity_1.ParkingNovedad,
                parking_excepcion_entity_1.ParkingExcepcion,
                parking_historial_entity_1.ParkingHistorial,
                parking_politica_sede_entity_1.ParkingPoliticaSede,
                sede_entity_1.Sede,
            ]),
        ],
        controllers: [parking_controller_1.ParkingController],
        providers: [
            parking_token_guard_1.ParkingTokenGuard,
            dashboard_service_1.DashboardParkingService,
            codigo_generator_service_1.CodigoGeneratorService,
            catalogos_service_1.CatalogosService,
            configuracion_service_1.ConfiguracionService,
            solicitudes_service_1.SolicitudesService,
            autorizaciones_service_1.AutorizacionesService,
            vehiculos_service_1.VehiculosService,
            zonas_service_1.ZonasService,
            vigilante_service_1.VigilanteService,
            novedades_service_1.NovedadesService,
            excepciones_service_1.ExcepcionesService,
            accesos_service_1.AccesosService,
            reportes_service_1.ReportesService,
        ],
        exports: [
            dashboard_service_1.DashboardParkingService,
            solicitudes_service_1.SolicitudesService,
            autorizaciones_service_1.AutorizacionesService,
            vigilante_service_1.VigilanteService,
        ],
    })
], ParkingModule);
//# sourceMappingURL=parking.module.js.map