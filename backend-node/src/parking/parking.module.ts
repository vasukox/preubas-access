import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

// ── Entidades ─────────────────────────────────────────────────────
import { ParkingSolicitud }      from './entities/parking-solicitud.entity'
import { ParkingVehiculo }       from './entities/parking-vehiculo.entity'
import { ParkingAutorizacion }   from './entities/parking-autorizacion.entity'
import { ParkingDocumento }      from './entities/parking-documento.entity'
import { ParkingZona }           from './entities/parking-zona.entity'
import { ParkingCupo }           from './entities/parking-cupo.entity'
import { ParkingAsignacionCupo } from './entities/parking-asignacion-cupo.entity'
import { ParkingAcceso }         from './entities/parking-acceso.entity'
import { ParkingNovedad }        from './entities/parking-novedad.entity'
import { ParkingExcepcion }      from './entities/parking-excepcion.entity'
import { ParkingHistorial }      from './entities/parking-historial.entity'
import { ParkingPoliticaSede }   from './entities/parking-politica-sede.entity'

// ── Entidades externas necesarias ────────────────────────────────
import { Sede }    from '../sede/entities/sede.entity'

// ── Guards ────────────────────────────────────────────────────────
import { ParkingTokenGuard } from './guards/parking-token.guard'

// ── Servicios ─────────────────────────────────────────────────────
import { DashboardParkingService } from './services/dashboard.service'
import { CodigoGeneratorService }  from './services/codigo-generator.service'
import { CatalogosService }        from './services/catalogos.service'
import { SolicitudesService }      from './services/solicitudes.service'
import { AutorizacionesService }   from './services/autorizaciones.service'
import { VehiculosService }        from './services/vehiculos.service'
import { ZonasService }            from './services/zonas.service'
import { VigilanteService }        from './services/vigilante.service'
import { NovedadesService }        from './services/novedades.service'
import { ExcepcionesService }      from './services/excepciones.service'
import { AccesosService }          from './services/accesos.service'
import { ReportesService }         from './services/reportes.service'
import { ConfiguracionService }    from './services/configuracion.service'

// ── Controlador ───────────────────────────────────────────────────
import { ParkingController } from './parking.controller'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Parking
      ParkingSolicitud,
      ParkingVehiculo,
      ParkingAutorizacion,
      ParkingDocumento,
      ParkingZona,
      ParkingCupo,
      ParkingAsignacionCupo,
      ParkingAcceso,
      ParkingNovedad,
      ParkingExcepcion,
      ParkingHistorial,
      ParkingPoliticaSede,
      // Externos
      Sede,
    ]),
  ],
  controllers: [ParkingController],
  providers: [
    // Guards (como providers para DI en guards que inyectan repos)
    ParkingTokenGuard,
    // Servicios
    DashboardParkingService,
    CodigoGeneratorService,
    CatalogosService,
    ConfiguracionService,
    SolicitudesService,
    AutorizacionesService,
    VehiculosService,
    ZonasService,
    VigilanteService,
    NovedadesService,
    ExcepcionesService,
    AccesosService,
    ReportesService,
  ],
  exports: [
    DashboardParkingService,
    SolicitudesService,
    AutorizacionesService,
    VigilanteService,
  ],
})
export class ParkingModule {}
