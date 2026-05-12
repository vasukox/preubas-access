"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GhDotacionItemEstado = exports.GhDotacionEntregaEstado = exports.GhEstadoAsistenciaInduccion = exports.GhEstadoSesionInduccion = exports.GhTipoAcceso = exports.GhImportacionEstado = exports.GhEstadoCita = exports.GhTipoCita = exports.GhTipoSesion = void 0;
var GhTipoSesion;
(function (GhTipoSesion) {
    GhTipoSesion["PRESENCIAL"] = "PRESENCIAL";
    GhTipoSesion["VIRTUAL"] = "VIRTUAL";
    GhTipoSesion["HIBRIDA"] = "HIBRIDA";
})(GhTipoSesion || (exports.GhTipoSesion = GhTipoSesion = {}));
var GhTipoCita;
(function (GhTipoCita) {
    GhTipoCita["INDUCCION"] = "INDUCCION";
    GhTipoCita["FIRMA_CONTRATO"] = "FIRMA_CONTRATO";
    GhTipoCita["ENTREGA_DOTACION"] = "ENTREGA_DOTACION";
    GhTipoCita["ENTREVISTA"] = "ENTREVISTA";
})(GhTipoCita || (exports.GhTipoCita = GhTipoCita = {}));
var GhEstadoCita;
(function (GhEstadoCita) {
    GhEstadoCita["PROGRAMADA"] = "PROGRAMADA";
    GhEstadoCita["CONFIRMADA"] = "CONFIRMADA";
    GhEstadoCita["EN_CURSO"] = "EN_CURSO";
    GhEstadoCita["FINALIZADA"] = "FINALIZADA";
    GhEstadoCita["NO_ASISTIO"] = "NO_ASISTIO";
    GhEstadoCita["CANCELADA"] = "CANCELADA";
})(GhEstadoCita || (exports.GhEstadoCita = GhEstadoCita = {}));
var GhImportacionEstado;
(function (GhImportacionEstado) {
    GhImportacionEstado["PENDIENTE"] = "PENDIENTE";
    GhImportacionEstado["PROCESANDO"] = "PROCESANDO";
    GhImportacionEstado["COMPLETADA"] = "COMPLETADA";
    GhImportacionEstado["FALLIDA"] = "FALLIDA";
})(GhImportacionEstado || (exports.GhImportacionEstado = GhImportacionEstado = {}));
var GhTipoAcceso;
(function (GhTipoAcceso) {
    GhTipoAcceso["ENTRADA"] = "ENTRADA";
    GhTipoAcceso["SALIDA"] = "SALIDA";
})(GhTipoAcceso || (exports.GhTipoAcceso = GhTipoAcceso = {}));
var GhEstadoSesionInduccion;
(function (GhEstadoSesionInduccion) {
    GhEstadoSesionInduccion["PROGRAMADA"] = "PROGRAMADA";
    GhEstadoSesionInduccion["EN_CURSO"] = "EN_CURSO";
    GhEstadoSesionInduccion["FINALIZADA"] = "FINALIZADA";
    GhEstadoSesionInduccion["CERRADA"] = "CERRADA";
    GhEstadoSesionInduccion["CANCELADA"] = "CANCELADA";
})(GhEstadoSesionInduccion || (exports.GhEstadoSesionInduccion = GhEstadoSesionInduccion = {}));
var GhEstadoAsistenciaInduccion;
(function (GhEstadoAsistenciaInduccion) {
    GhEstadoAsistenciaInduccion["PENDIENTE"] = "PENDIENTE";
    GhEstadoAsistenciaInduccion["CHECKIN_OK"] = "CHECKIN_OK";
    GhEstadoAsistenciaInduccion["EN_SESION"] = "EN_SESION";
    GhEstadoAsistenciaInduccion["CHECKOUT_OK"] = "CHECKOUT_OK";
    GhEstadoAsistenciaInduccion["NO_ASISTIO"] = "NO_ASISTIO";
    GhEstadoAsistenciaInduccion["SALIDA_PENDIENTE"] = "SALIDA_PENDIENTE";
})(GhEstadoAsistenciaInduccion || (exports.GhEstadoAsistenciaInduccion = GhEstadoAsistenciaInduccion = {}));
var GhDotacionEntregaEstado;
(function (GhDotacionEntregaEstado) {
    GhDotacionEntregaEstado["PENDIENTE"] = "PENDIENTE";
    GhDotacionEntregaEstado["PARCIAL"] = "PARCIAL";
    GhDotacionEntregaEstado["COMPLETA"] = "COMPLETA";
    GhDotacionEntregaEstado["REPROGRAMADA"] = "REPROGRAMADA";
    GhDotacionEntregaEstado["ANULADA"] = "ANULADA";
})(GhDotacionEntregaEstado || (exports.GhDotacionEntregaEstado = GhDotacionEntregaEstado = {}));
var GhDotacionItemEstado;
(function (GhDotacionItemEstado) {
    GhDotacionItemEstado["PENDIENTE"] = "PENDIENTE";
    GhDotacionItemEstado["ENTREGADO"] = "ENTREGADO";
    GhDotacionItemEstado["FALTANTE"] = "FALTANTE";
})(GhDotacionItemEstado || (exports.GhDotacionItemEstado = GhDotacionItemEstado = {}));
//# sourceMappingURL=gh.enum.js.map