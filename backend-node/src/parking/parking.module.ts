import { Module } from '@nestjs/common';

/**
 * ParkingModule — módulo de control de parqueadero.
 *
 * Estado: PENDIENTE DE IMPLEMENTACIÓN (Fase futura).
 *
 * Lo que estará disponible cuando se implemente:
 *   - Control de entrada/salida de vehículos (cámara LPR)
 *   - Registro de placas y propietarios
 *   - Dashboard de ocupación en tiempo real
 *   - Integración con API Key LPR (X-LPR-API-Key header)
 *
 * Roles: ADMIN_PARKING, VIGILANTE_PARKING, ADMIN_GLOBAL
 * API Key: LPR_API_KEY (ya configurada en ConfigService)
 */
@Module({})
export class ParkingModule {}
