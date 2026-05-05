"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROL_META = void 0;
const rol_enum_1 = require("../common/enums/rol.enum");
exports.ROL_META = {
    [rol_enum_1.RolNombre.ADMIN_GLOBAL]: {
        descripcion: 'Acceso total al sistema. Puede gestionar todos los módulos y usuarios.',
        color: '#F59E0B',
        modulos: ['Todo el sistema'],
        grupos: [
            {
                grupo: 'Administracion global',
                modulo: 'Herramientas',
                submodulos: ['Usuarios', 'Roles', 'Permisos', 'Auditoria'],
                puede_eliminar: ['Usuarios desactivados', 'Asignaciones de rol', 'Registros de configuracion'],
            },
            {
                grupo: 'Operacion HSE',
                modulo: 'HSE',
                submodulos: ['Dashboard', 'Panel General', 'Gestion', 'Vigilante', 'Excepciones', 'Cumplimiento'],
                puede_eliminar: ['Autorizaciones rechazadas', 'Anotaciones operativas', 'Asignaciones temporales'],
            },
            {
                grupo: 'Operacion transversal',
                modulo: 'Parking / NFC / GH',
                submodulos: ['Parking', 'Parking Vigilante', 'Activos NFC', 'Gestion Humana'],
                puede_eliminar: ['Registros operativos segun politica', 'Asignaciones internas'],
            },
        ],
    },
    [rol_enum_1.RolNombre.ADMIN_HSE]: {
        descripcion: 'Gestión completa del módulo HSE. Ve todos los submodulos de HSE y Reportes.',
        color: '#10B981',
        modulos: ['Dashboard HSE', 'Panel General', 'Gestión', 'Vigilante', 'Excepciones', 'Cumplimiento', 'Reportes'],
        grupos: [
            {
                grupo: 'Control HSE',
                modulo: 'HSE',
                submodulos: ['Dashboard', 'Panel General', 'Gestion', 'Vigilante', 'Excepciones', 'Cumplimiento'],
                puede_eliminar: ['Observaciones de checklist', 'Asignaciones duplicadas de flujo'],
            },
        ],
    },
    [rol_enum_1.RolNombre.GESTION_HSE]: {
        descripcion: 'Gestión de autorizaciones HSE normales y excepciones. No accede a Vigilante.',
        color: '#6366F1',
        modulos: ['Dashboard HSE', 'Panel General', 'Gestión', 'Excepciones', 'Cumplimiento'],
        grupos: [
            {
                grupo: 'Gestion documental HSE',
                modulo: 'HSE',
                submodulos: ['Dashboard', 'Panel General', 'Gestion', 'Excepciones', 'Cumplimiento'],
                puede_eliminar: ['Archivos invalidos', 'Comentarios operativos'],
            },
        ],
    },
    [rol_enum_1.RolNombre.VIGILANTE_HSE]: {
        descripcion: 'Operación del portal de portería HSE. Verifica y registra accesos.',
        color: '#EC4899',
        modulos: ['Dashboard HSE', 'Vigilante'],
        grupos: [
            {
                grupo: 'Porteria HSE',
                modulo: 'HSE',
                submodulos: ['Dashboard', 'Vigilante'],
                puede_eliminar: ['No aplica'],
            },
        ],
    },
    [rol_enum_1.RolNombre.ADMIN_PARKING]: {
        descripcion: 'Gestión del módulo de parqueadero.',
        color: '#F59E0B',
        modulos: ['Parking'],
        grupos: [
            {
                grupo: 'Control de parqueadero',
                modulo: 'Parking',
                submodulos: ['Panel Parking', 'Config cupos', 'Bitacora'],
                puede_eliminar: ['Reservas canceladas', 'Registros duplicados'],
            },
        ],
    },
    [rol_enum_1.RolNombre.VIGILANTE_PARKING]: {
        descripcion: 'Operación del portal de portería de parqueadero.',
        color: '#F97316',
        modulos: ['Parking Vigilante'],
        grupos: [
            {
                grupo: 'Porteria Parking',
                modulo: 'Parking',
                submodulos: ['Ingreso', 'Salida', 'Consulta rapida'],
                puede_eliminar: ['No aplica'],
            },
        ],
    },
    [rol_enum_1.RolNombre.ADMIN_NFC]: {
        descripcion: 'Gestión del módulo de activos con chips NFC.',
        color: '#8B5CF6',
        modulos: ['Activos NFC'],
        grupos: [
            {
                grupo: 'Activos y trazabilidad',
                modulo: 'NFC',
                submodulos: ['Activos', 'Asignacion', 'Movimientos', 'Auditoria'],
                puede_eliminar: ['Asignaciones erradas', 'Lecturas invalidas'],
            },
        ],
    },
    [rol_enum_1.RolNombre.ADMIN_GH]: {
        descripcion: 'Gestión del módulo de Gestión Humana y citas.',
        color: '#14B8A6',
        modulos: ['Gestión Humana'],
        grupos: [
            {
                grupo: 'Gestion humana',
                modulo: 'GH',
                submodulos: ['Empleados', 'Citas', 'Novedades'],
                puede_eliminar: ['Citas canceladas', 'Novedades duplicadas'],
            },
        ],
    },
    [rol_enum_1.RolNombre.VISUALIZADOR]: {
        descripcion: 'Solo lectura de reportes y dashboards.',
        color: '#6B7280',
        modulos: ['Reportes', 'Dashboards (solo lectura)'],
        grupos: [
            {
                grupo: 'Consulta',
                modulo: 'Reportes',
                submodulos: ['Reportes', 'Dashboards'],
                puede_eliminar: ['No permitido'],
            },
        ],
    },
};
//# sourceMappingURL=herramientas.constants.js.map