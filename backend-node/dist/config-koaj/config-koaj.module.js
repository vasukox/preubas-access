"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigKoajModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const cat_eps_entity_1 = require("../hse/entities/cat-eps.entity");
const cat_arl_entity_1 = require("../hse/entities/cat-arl.entity");
const cat_afp_entity_1 = require("../hse/entities/cat-afp.entity");
const cat_norma_seguridad_entity_1 = require("../hse/entities/cat-norma-seguridad.entity");
const sede_entity_1 = require("../sede/entities/sede.entity");
const ubicacion_entity_1 = require("../sede/entities/ubicacion.entity");
const config_koaj_controller_1 = require("./config-koaj.controller");
const config_koaj_service_1 = require("./config-koaj.service");
let ConfigKoajModule = class ConfigKoajModule {
};
exports.ConfigKoajModule = ConfigKoajModule;
exports.ConfigKoajModule = ConfigKoajModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                sede_entity_1.Sede,
                ubicacion_entity_1.Ubicacion,
                cat_eps_entity_1.CatEps,
                cat_arl_entity_1.CatArl,
                cat_afp_entity_1.CatAfp,
                cat_norma_seguridad_entity_1.CatNormaSeguridad,
            ]),
        ],
        controllers: [config_koaj_controller_1.ConfigKoajController],
        providers: [config_koaj_service_1.ConfigKoajService],
        exports: [config_koaj_service_1.ConfigKoajService],
    })
], ConfigKoajModule);
//# sourceMappingURL=config-koaj.module.js.map