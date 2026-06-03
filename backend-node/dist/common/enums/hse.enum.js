"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModalidadTrabajo = exports.RiesgoClasificacion = exports.CumplimientoEstado = exports.TipoAcceso = exports.MetodoAcceso = exports.RhSanguineo = exports.RelacionEmergencia = exports.ConceptoMedico = exports.PermisoTipo = exports.PilaEstado = exports.PilaTipo = exports.ElectricoMatricula = exports.ConfinadosRol = exports.AlturasNivel = exports.TipoDocumento = exports.SolicitudArchivadoEstado = exports.EstadoContratista = exports.EstadoAutorizacion = exports.TipoContratista = void 0;
var TipoContratista;
(function (TipoContratista) {
    TipoContratista["ALTO_RIESGO"] = "ALTO_RIESGO";
    TipoContratista["NORMAL"] = "NORMAL";
})(TipoContratista || (exports.TipoContratista = TipoContratista = {}));
var EstadoAutorizacion;
(function (EstadoAutorizacion) {
    EstadoAutorizacion["BORRADOR"] = "BORRADOR";
    EstadoAutorizacion["PENDIENTE_AUTOGESTION"] = "PENDIENTE_AUTOGESTION";
    EstadoAutorizacion["EN_REVISION"] = "EN_REVISION";
    EstadoAutorizacion["APROBADO"] = "APROBADO";
    EstadoAutorizacion["DENEGADO"] = "DENEGADO";
    EstadoAutorizacion["VENCIDO"] = "VENCIDO";
})(EstadoAutorizacion || (exports.EstadoAutorizacion = EstadoAutorizacion = {}));
var EstadoContratista;
(function (EstadoContratista) {
    EstadoContratista["PENDIENTE_AUTOGESTION"] = "PENDIENTE_AUTOGESTION";
    EstadoContratista["AUTOGESTION_EN_PROGRESO"] = "AUTOGESTION_EN_PROGRESO";
    EstadoContratista["AUTOGESTION_COMPLETADA"] = "AUTOGESTION_COMPLETADA";
    EstadoContratista["EN_REVISION"] = "EN_REVISION";
    EstadoContratista["APROBADO"] = "APROBADO";
    EstadoContratista["DENEGADO"] = "DENEGADO";
    EstadoContratista["ARCHIVADO"] = "ARCHIVADO";
})(EstadoContratista || (exports.EstadoContratista = EstadoContratista = {}));
var SolicitudArchivadoEstado;
(function (SolicitudArchivadoEstado) {
    SolicitudArchivadoEstado["PENDIENTE"] = "PENDIENTE";
    SolicitudArchivadoEstado["APROBADO"] = "APROBADO";
    SolicitudArchivadoEstado["RECHAZADO"] = "RECHAZADO";
})(SolicitudArchivadoEstado || (exports.SolicitudArchivadoEstado = SolicitudArchivadoEstado = {}));
var TipoDocumento;
(function (TipoDocumento) {
    TipoDocumento["CC"] = "CC";
    TipoDocumento["CE"] = "CE";
    TipoDocumento["PASAPORTE"] = "PASAPORTE";
    TipoDocumento["TI"] = "TI";
})(TipoDocumento || (exports.TipoDocumento = TipoDocumento = {}));
var AlturasNivel;
(function (AlturasNivel) {
    AlturasNivel["BASICO"] = "BASICO";
    AlturasNivel["AVANZADO"] = "AVANZADO";
    AlturasNivel["COORDINADOR"] = "COORDINADOR";
})(AlturasNivel || (exports.AlturasNivel = AlturasNivel = {}));
var ConfinadosRol;
(function (ConfinadosRol) {
    ConfinadosRol["SUPERVISOR"] = "SUPERVISOR";
    ConfinadosRol["VIGIA"] = "VIGIA";
    ConfinadosRol["ENTRANTE"] = "ENTRANTE";
})(ConfinadosRol || (exports.ConfinadosRol = ConfinadosRol = {}));
var ElectricoMatricula;
(function (ElectricoMatricula) {
    ElectricoMatricula["TE1"] = "TE1";
    ElectricoMatricula["TE2"] = "TE2";
    ElectricoMatricula["TE3"] = "TE3";
    ElectricoMatricula["TE4"] = "TE4";
    ElectricoMatricula["TE5"] = "TE5";
    ElectricoMatricula["TE6"] = "TE6";
})(ElectricoMatricula || (exports.ElectricoMatricula = ElectricoMatricula = {}));
var PilaTipo;
(function (PilaTipo) {
    PilaTipo["INTEGRADA"] = "INTEGRADA";
    PilaTipo["MANUAL"] = "MANUAL";
    PilaTipo["NO_APLICA"] = "NO_APLICA";
})(PilaTipo || (exports.PilaTipo = PilaTipo = {}));
var PilaEstado;
(function (PilaEstado) {
    PilaEstado["PENDIENTE"] = "PENDIENTE";
    PilaEstado["PAGADA"] = "PAGADA";
    PilaEstado["VENCIDA"] = "VENCIDA";
})(PilaEstado || (exports.PilaEstado = PilaEstado = {}));
var PermisoTipo;
(function (PermisoTipo) {
    PermisoTipo["ALTURAS"] = "ALTURAS";
    PermisoTipo["CONFINADOS"] = "CONFINADOS";
    PermisoTipo["CALIENTE"] = "CALIENTE";
    PermisoTipo["ELECTRICO"] = "ELECTRICO";
    PermisoTipo["GENERAL"] = "GENERAL";
})(PermisoTipo || (exports.PermisoTipo = PermisoTipo = {}));
var ConceptoMedico;
(function (ConceptoMedico) {
    ConceptoMedico["APTO"] = "APTO";
    ConceptoMedico["APTO_CON_RESTRICCION"] = "APTO_CON_RESTRICCION";
    ConceptoMedico["NO_APTO"] = "NO_APTO";
    ConceptoMedico["PENDIENTE"] = "PENDIENTE";
})(ConceptoMedico || (exports.ConceptoMedico = ConceptoMedico = {}));
var RelacionEmergencia;
(function (RelacionEmergencia) {
    RelacionEmergencia["FAMILIAR"] = "FAMILIAR";
    RelacionEmergencia["CONYUGE"] = "CONYUGE";
    RelacionEmergencia["COLEGA"] = "COLEGA";
    RelacionEmergencia["OTRO"] = "OTRO";
})(RelacionEmergencia || (exports.RelacionEmergencia = RelacionEmergencia = {}));
var RhSanguineo;
(function (RhSanguineo) {
    RhSanguineo["A_POS"] = "A_POS";
    RhSanguineo["A_NEG"] = "A_NEG";
    RhSanguineo["B_POS"] = "B_POS";
    RhSanguineo["B_NEG"] = "B_NEG";
    RhSanguineo["AB_POS"] = "AB_POS";
    RhSanguineo["AB_NEG"] = "AB_NEG";
    RhSanguineo["O_POS"] = "O_POS";
    RhSanguineo["O_NEG"] = "O_NEG";
})(RhSanguineo || (exports.RhSanguineo = RhSanguineo = {}));
var MetodoAcceso;
(function (MetodoAcceso) {
    MetodoAcceso["CEDULA_MANUAL"] = "CEDULA_MANUAL";
    MetodoAcceso["LECTOR_USB"] = "LECTOR_USB";
    MetodoAcceso["MANUAL_VIGILANTE"] = "MANUAL_VIGILANTE";
})(MetodoAcceso || (exports.MetodoAcceso = MetodoAcceso = {}));
var TipoAcceso;
(function (TipoAcceso) {
    TipoAcceso["ENTRADA"] = "ENTRADA";
    TipoAcceso["SALIDA"] = "SALIDA";
})(TipoAcceso || (exports.TipoAcceso = TipoAcceso = {}));
var CumplimientoEstado;
(function (CumplimientoEstado) {
    CumplimientoEstado["EN_PROGRESO"] = "EN_PROGRESO";
    CumplimientoEstado["COMPLETADO"] = "COMPLETADO";
    CumplimientoEstado["INCUMPLIMIENTO"] = "INCUMPLIMIENTO";
})(CumplimientoEstado || (exports.CumplimientoEstado = CumplimientoEstado = {}));
var RiesgoClasificacion;
(function (RiesgoClasificacion) {
    RiesgoClasificacion["BAJO"] = "BAJO";
    RiesgoClasificacion["MEDIO"] = "MEDIO";
    RiesgoClasificacion["ALTO"] = "ALTO";
})(RiesgoClasificacion || (exports.RiesgoClasificacion = RiesgoClasificacion = {}));
var ModalidadTrabajo;
(function (ModalidadTrabajo) {
    ModalidadTrabajo["PRESENCIAL"] = "PRESENCIAL";
    ModalidadTrabajo["REMOTO"] = "REMOTO";
    ModalidadTrabajo["HIBRIDO"] = "HIBRIDO";
})(ModalidadTrabajo || (exports.ModalidadTrabajo = ModalidadTrabajo = {}));
//# sourceMappingURL=hse.enum.js.map