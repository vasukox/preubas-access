/**
 * Constantes de roles del sistema.
 *
 * Equivalente a `class RolNombre` en Python (app/models/usuario.py).
 * Evita strings hardcodeados en el código.
 */
export enum RolNombre {
  ADMIN_GLOBAL = 'ADMIN_GLOBAL',
  ADMIN_PARKING = 'ADMIN_PARKING',
  ADMIN_HSE = 'ADMIN_HSE',
  GESTION_HSE = 'GESTION_HSE',
  ADMIN_NFC = 'ADMIN_NFC',
  ADMIN_GH = 'ADMIN_GH',
  VIGILANTE_HSE = 'VIGILANTE_HSE',
  VIGILANTE_PARKING = 'VIGILANTE_PARKING',
  VISUALIZADOR = 'VISUALIZADOR',
}
