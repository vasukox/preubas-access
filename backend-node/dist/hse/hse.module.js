"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HseModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const persona_module_1 = require("../persona/persona.module");
const sede_entity_1 = require("../sede/entities/sede.entity");
const config_tiempos_contratista_entity_1 = require("../config-koaj/entities/config-tiempos-contratista.entity");
const cat_eps_entity_1 = require("./entities/cat-eps.entity");
const cat_arl_entity_1 = require("./entities/cat-arl.entity");
const cat_afp_entity_1 = require("./entities/cat-afp.entity");
const cat_norma_seguridad_entity_1 = require("./entities/cat-norma-seguridad.entity");
const hse_autorizacion_entity_1 = require("./entities/hse-autorizacion.entity");
const hse_contratista_entity_1 = require("./entities/hse-contratista.entity");
const hse_clasificacion_entity_1 = require("./entities/hse-clasificacion.entity");
const hse_seg_social_entity_1 = require("./entities/hse-seg-social.entity");
const hse_certificaciones_entity_1 = require("./entities/hse-certificaciones.entity");
const hse_examen_medico_entity_1 = require("./entities/hse-examen-medico.entity");
const hse_contacto_emergencia_entity_1 = require("./entities/hse-contacto-emergencia.entity");
const hse_aceptacion_normas_entity_1 = require("./entities/hse-aceptacion-normas.entity");
const hse_acceso_entity_1 = require("./entities/hse-acceso.entity");
const hse_cumplimiento_entity_1 = require("./entities/hse-cumplimiento.entity");
const hse_cumplimiento_item_entity_1 = require("./entities/hse-cumplimiento-item.entity");
const hse_excepcion_entity_1 = require("./entities/hse-excepcion.entity");
const hse_historial_entity_1 = require("./entities/hse-historial.entity");
const hse_controller_1 = require("./hse.controller");
const hse_service_1 = require("./hse.service");
const autorizacion_service_1 = require("./services/autorizacion.service");
const codigo_generator_service_1 = require("./services/codigo-generator.service");
const autorizacion_validator_1 = require("./validators/autorizacion.validator");
const autogestion_service_1 = require("./services/autogestion.service");
const token_validator_service_1 = require("./services/token-validator.service");
const acceso_service_1 = require("./services/acceso.service");
const cumplimiento_service_1 = require("./services/cumplimiento.service");
const validacion_service_1 = require("./services/validacion.service");
const excepcion_service_1 = require("./services/excepcion.service");
const reportes_service_1 = require("./services/reportes.service");
const upload_security_service_1 = require("./services/upload-security.service");
let HseModule = class HseModule {
};
exports.HseModule = HseModule;
exports.HseModule = HseModule = __decorate([
    (0, common_1.Module)({
        imports: [
            persona_module_1.PersonaModule,
            typeorm_1.TypeOrmModule.forFeature([
                sede_entity_1.Sede,
                config_tiempos_contratista_entity_1.ConfigTiemposContratista,
                cat_eps_entity_1.CatEps,
                cat_arl_entity_1.CatArl,
                cat_afp_entity_1.CatAfp,
                cat_norma_seguridad_entity_1.CatNormaSeguridad,
                hse_autorizacion_entity_1.HseAutorizacion,
                hse_contratista_entity_1.HseContratista,
                hse_clasificacion_entity_1.HseClasificacion,
                hse_seg_social_entity_1.HseSegSocial,
                hse_certificaciones_entity_1.HseCertificaciones,
                hse_examen_medico_entity_1.HseExamenMedico,
                hse_contacto_emergencia_entity_1.HseContactoEmergencia,
                hse_aceptacion_normas_entity_1.HseAceptacionNormas,
                hse_acceso_entity_1.HseAcceso,
                hse_cumplimiento_entity_1.HseCumplimiento,
                hse_cumplimiento_item_entity_1.HseCumplimientoItem,
                hse_excepcion_entity_1.HseExcepcion,
                hse_historial_entity_1.HseHistorial,
            ]),
        ],
        controllers: [hse_controller_1.HseController],
        providers: [
            hse_service_1.HseService,
            autorizacion_service_1.AutorizacionService,
            codigo_generator_service_1.CodigoGeneratorService,
            autorizacion_validator_1.AutorizacionValidator,
            autogestion_service_1.AutogestionService,
            token_validator_service_1.TokenValidatorService,
            acceso_service_1.AccesoService,
            cumplimiento_service_1.CumplimientoService,
            validacion_service_1.ValidacionService,
            excepcion_service_1.ExcepcionService,
            reportes_service_1.ReportesService,
            upload_security_service_1.UploadSecurityService,
        ],
        exports: [typeorm_1.TypeOrmModule],
    })
], HseModule);
//# sourceMappingURL=hse.module.js.map