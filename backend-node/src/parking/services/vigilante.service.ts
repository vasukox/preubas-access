import { Injectable, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm'
import { ParkingAutorizacion } from '../entities/parking-autorizacion.entity'
import { ParkingExcepcion }    from '../entities/parking-excepcion.entity'
import { ParkingAcceso }       from '../entities/parking-acceso.entity'
import { ParkingCupo }         from '../entities/parking-cupo.entity'
import {
  EstadoAutorizacionParking, EstadoCupo, MetodoAccesoParking, ResultadoVerificacion,
} from '../../common/enums/parking.enum'
import {
  VerificarPlacaDto, RegistrarEntradaDto, RegistrarSalidaDto,
} from '../dto/vigilante.dto'

type ColorSemaforo = 'VERDE' | 'AMARILLO' | 'ROJO' | 'AZUL' | 'GRIS'

function normalizarPlaca(placa: string): string {
  return placa.toUpperCase().replace(/\s+/g, '').replace(/-/g, '').trim()
}

function validarFormatoPlaca(placa: string): boolean {
  const formatos = [
    /^[A-Z]{3}[0-9]{3}$/,      // COLOMBIANA_CARRO
    /^[A-Z]{2}[0-9]{4}$/,      // COLOMBIANA_CARRO_VIEJA
    /^[A-Z]{3}[0-9]{2}[A-Z]$/, // COLOMBIANA_MOTO_NUEVA
    /^[A-Z]{3}[0-9]{2}$/,      // COLOMBIANA_MOTO_VIEJA
    /^[RS][0-9]{5}$/,           // REMOLQUE
    /^O[A-Z]{2}[0-9]{3}$/,     // OFICIAL
    /^[DCOAM][A-Z][0-9]{4}$/,  // DIPLOMATICA
    /^FAC[0-9]{6}$/,            // FAC
    /^[A-Z]{2}[0-9]{3}[A-Z]{2}$/, // MERCOSUR ARG
    /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/, // MERCOSUR BRA
    /^[A-Z]{4}[0-9]{3}$/,      // MERCOSUR PAR
    /^[A-Z0-9-]{4,9}$/,         // EXTRANJERA OTRO
  ]
  return formatos.some(r => r.test(placa))
}

@Injectable()
export class VigilanteService {
  constructor(
    @InjectRepository(ParkingAutorizacion)
    private readonly autorizacionRepo: Repository<ParkingAutorizacion>,

    @InjectRepository(ParkingExcepcion)
    private readonly excepcionRepo: Repository<ParkingExcepcion>,

    @InjectRepository(ParkingAcceso)
    private readonly accesoRepo: Repository<ParkingAcceso>,

    @InjectRepository(ParkingCupo)
    private readonly cupoRepo: Repository<ParkingCupo>,
  ) {}

  async verificar(dto: VerificarPlacaDto) {
    const placa = normalizarPlaca(dto.placa)

    if (!validarFormatoPlaca(placa)) {
      return {
        resultado:      ResultadoVerificacion.NO_REGISTRADO,
        color_semaforo: 'GRIS' as ColorSemaforo,
        mensaje:        `Formato de placa no reconocido: ${placa}`,
        autorizacion:   null, vehiculo: null, persona: null,
        cupo_asignado:  null, ya_esta_dentro: false, alertas: [],
      }
    }

    const ahora = new Date()

    // Buscar autorización activa
    const autorizacion = await this.autorizacionRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.vehiculo', 'v')
      .leftJoinAndSelect('a.persona',  'p')
      .leftJoinAndSelect('a.cupo',     'c')
      .leftJoinAndSelect('c.zona',     'z')
      .where('v.placa = :placa',   { placa })
      .andWhere('a.sedeId = :sid', { sid: dto.sedeId })
      .andWhere('a.estado IN (:...estados)', {
        estados: [EstadoAutorizacionParking.ACTIVA, EstadoAutorizacionParking.SUSPENDIDA],
      })
      .getOne()

    // Buscar excepción activa
    const excepcion = await this.excepcionRepo.findOne({
      where: {
        placa,
        sedeId: dto.sedeId,
        activa: true,
        fechaInicio: LessThanOrEqual(ahora),
        fechaFin:    MoreThanOrEqual(ahora),
      },
    })

    // Sin registro
    if (!autorizacion && !excepcion) {
      return {
        resultado:      ResultadoVerificacion.NO_REGISTRADO,
        color_semaforo: 'GRIS' as ColorSemaforo,
        mensaje:        'Placa no registrada en el sistema para esta sede',
        autorizacion:   null, vehiculo: null, persona: null,
        cupo_asignado:  null, ya_esta_dentro: false, alertas: [],
      }
    }

    // Hay excepción, sin autorización
    if (excepcion && !autorizacion) {
      return {
        resultado:      ResultadoVerificacion.EXCEPCION,
        color_semaforo: 'AZUL' as ColorSemaforo,
        mensaje:        `Excepción activa: ${excepcion.tipoExcepcion} — ${excepcion.motivo}`,
        autorizacion:   null, vehiculo: null,
        persona:        excepcion.nombrePersona ? { nombres: excepcion.nombrePersona, apellidos: '' } : null,
        cupo_asignado:  null, ya_esta_dentro: false, alertas: [],
      }
    }

    // Tiene autorización — verificar estado
    if (autorizacion!.estado === EstadoAutorizacionParking.SUSPENDIDA) {
      return {
        resultado:      ResultadoVerificacion.SUSPENDIDO,
        color_semaforo: 'ROJO' as ColorSemaforo,
        mensaje:        'Autorización suspendida. Contactar con el administrador de parking.',
        autorizacion:   { id: autorizacion!.id }, vehiculo: null, persona: null,
        cupo_asignado:  null, ya_esta_dentro: false, alertas: [],
      }
    }

    // Vencida por fecha
    if (autorizacion!.fechaFin < ahora) {
      return {
        resultado:      ResultadoVerificacion.VENCIDO,
        color_semaforo: 'ROJO' as ColorSemaforo,
        mensaje:        `Autorización vencida el ${autorizacion!.fechaFin.toLocaleDateString('es-CO')}`,
        autorizacion:   { id: autorizacion!.id }, vehiculo: null, persona: null,
        cupo_asignado:  null, ya_esta_dentro: false, alertas: [],
      }
    }

    // Validar horario si aplica
    if (autorizacion!.horarioInicio && autorizacion!.horarioFin) {
      const horaActual = ahora.toTimeString().slice(0, 5)
      if (horaActual < autorizacion!.horarioInicio || horaActual > autorizacion!.horarioFin) {
        return {
          resultado:      ResultadoVerificacion.NO_AUTORIZADO,
          color_semaforo: 'ROJO' as ColorSemaforo,
          mensaje:        `Fuera del horario autorizado (${autorizacion!.horarioInicio} – ${autorizacion!.horarioFin})`,
          autorizacion:   { id: autorizacion!.id }, vehiculo: null, persona: null,
          cupo_asignado:  null, ya_esta_dentro: false, alertas: [],
        }
      }
    }

    // Verificar si ya está dentro
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const yaEstaAdentro = await this.accesoRepo
      .createQueryBuilder('a')
      .where('a.placa = :placa',  { placa })
      .andWhere('a.sedeId = :sid', { sid: dto.sedeId })
      .andWhere('a.tipoAcceso = :tipo', { tipo: 'ENTRADA' })
      .andWhere('a.resultado = :r', { r: ResultadoVerificacion.AUTORIZADO })
      .andWhere('a.fechaHora >= :cutoff', { cutoff })
      .andWhere(`NOT EXISTS (
        SELECT 1 FROM parking_accesos s
        WHERE s.placa = a.placa
          AND s.sede_id = a.sede_id
          AND s.tipo_acceso = 'SALIDA'
          AND s.fecha_hora > a.fecha_hora
          AND s.deleted_at IS NULL
      )`)
      .getOne()

    // Alertas
    const alertas: string[] = []
    const diasParaVencer = Math.ceil((autorizacion!.fechaFin.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24))
    if (diasParaVencer <= 30) {
      alertas.push(`Autorización vence en ${diasParaVencer} día(s)`)
    }

    const colorSemaforo: ColorSemaforo = alertas.length > 0 ? 'AMARILLO' : 'VERDE'

    const v = autorizacion!.vehiculo
    const p = autorizacion!.persona

    return {
      resultado:      ResultadoVerificacion.AUTORIZADO,
      color_semaforo: colorSemaforo,
      mensaje:        alertas.length > 0 ? 'Autorizado con alertas' : 'Puede ingresar',
      autorizacion: {
        id:               autorizacion!.id,
        tipo_autorizacion: autorizacion!.tipoAutorizacion,
        horario_inicio:    autorizacion!.horarioInicio,
        horario_fin:       autorizacion!.horarioFin,
        fecha_fin:         autorizacion!.fechaFin,
      },
      vehiculo: v ? {
        placa:         v.placa,
        marca:         v.marca,
        linea:         v.linea,
        color:         v.color,
        tipo_vehiculo: v.tipoVehiculo,
      } : null,
      persona: p ? {
        nombres:          (p as any).nombres,
        apellidos:        (p as any).apellidos,
        numero_documento: (p as any).numeroDocumento ?? (p as any).numero_documento,
      } : null,
      cupo_asignado: autorizacion!.cupo ? {
        id:          autorizacion!.cupo.id,
        numero_cupo: autorizacion!.cupo.numeroCupo,
        tipo_cupo:   autorizacion!.cupo.tipoCupo,
        estado:      autorizacion!.cupo.estado,
        zona: autorizacion!.cupo.zona ? { id: autorizacion!.cupo.zona.id, nombre: autorizacion!.cupo.zona.nombre } : null,
      } : null,
      ya_esta_dentro: Boolean(yaEstaAdentro),
      alertas,
    }
  }

  async registrarEntrada(dto: RegistrarEntradaDto, usuarioId: number) {
    const placa = normalizarPlaca(dto.placa)

    const acceso = this.accesoRepo.create({
      sedeId:        dto.sedeId,
      registradoPor: usuarioId,
      autorizacionId: dto.autorizacionId  ?? null,
      excepcionId:   dto.excepcionId ?? null,
      cupoId:        dto.cupoId     ?? null,
      placa,
      tipoAcceso:    'ENTRADA',
      metodo:        dto.metodo,
      resultado:     ResultadoVerificacion.AUTORIZADO,
      observacion:   dto.observacion ?? null,
      fechaHora:     new Date(),
    })
    await this.accesoRepo.save(acceso)

    // Si hay cupo, marcarlo como ocupado
    if (dto.cupoId) {
      await this.cupoRepo.update(dto.cupoId, { estado: EstadoCupo.OCUPADO })
    }

    return {
      acceso_id:    acceso.id,
      resultado:    acceso.resultado,
      tipo_acceso:  acceso.tipoAcceso,
      fecha_hora:   acceso.fechaHora,
      cupo:         dto.cupoId ? { id: dto.cupoId } : null,
      mensaje:      'Entrada registrada exitosamente',
    }
  }

  async registrarSalida(dto: RegistrarSalidaDto, usuarioId: number) {
    const placa = normalizarPlaca(dto.placa)

    // Encontrar la última entrada para liberar cupo
    const ultimaEntrada = await this.accesoRepo.findOne({
      where: { placa, sedeId: dto.sedeId, tipoAcceso: 'ENTRADA' },
      order: { fechaHora: 'DESC' },
    })

    const acceso = this.accesoRepo.create({
      sedeId:        dto.sedeId,
      registradoPor: usuarioId,
      autorizacionId: dto.autorizacionId ?? ultimaEntrada?.autorizacionId ?? null,
      cupoId:        ultimaEntrada?.cupoId ?? null,
      placa,
      tipoAcceso:    'SALIDA',
      metodo:        dto.metodo,
      resultado:     ResultadoVerificacion.AUTORIZADO,
      observacion:   dto.observacion ?? null,
      fechaHora:     new Date(),
    })
    await this.accesoRepo.save(acceso)

    // Liberar cupo si había uno asignado
    if (ultimaEntrada?.cupoId) {
      await this.cupoRepo.update(ultimaEntrada.cupoId, { estado: EstadoCupo.ASIGNADO })
    }

    return {
      acceso_id:   acceso.id,
      resultado:   acceso.resultado,
      tipo_acceso: acceso.tipoAcceso,
      fecha_hora:  acceso.fechaHora,
      cupo:        null,
      mensaje:     'Salida registrada exitosamente',
    }
  }

  async getDentroAhora(sedeId: number) {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const entradas = await this.accesoRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.autorizacion',           'aut')
      .leftJoinAndSelect('aut.persona',              'p')
      .leftJoinAndSelect('a.cupo',                   'c')
      .leftJoinAndSelect('c.zona',                   'z')
      .where('a.sedeId = :sedeId',    { sedeId })
      .andWhere('a.tipoAcceso = :tipo', { tipo: 'ENTRADA' })
      .andWhere('a.resultado = :r',    { r: ResultadoVerificacion.AUTORIZADO })
      .andWhere('a.fechaHora >= :cutoff', { cutoff })
      .andWhere(`NOT EXISTS (
        SELECT 1 FROM parking_accesos s
        WHERE s.placa = a.placa
          AND s.sede_id = a.sede_id
          AND s.tipo_acceso = 'SALIDA'
          AND s.fecha_hora > a.fecha_hora
          AND s.deleted_at IS NULL
      )`)
      .orderBy('a.fechaHora', 'DESC')
      .getMany()

    const ahora = new Date()
    const vehiculos = entradas.map(e => {
      const minutos = Math.floor((ahora.getTime() - e.fechaHora.getTime()) / 60000)
      const horas   = Math.floor(minutos / 60)
      const mins    = minutos % 60
      const persona = e.autorizacion?.persona
      return {
        placa:        e.placa,
        tipo_vehiculo: e.tipoVehiculo,
        persona:      persona ? `${(persona as any).nombres} ${(persona as any).apellidos}` : null,
        hora_entrada: e.fechaHora,
        tiempo_dentro: horas > 0 ? `${horas}h ${mins}min` : `${mins}min`,
        cupo:         e.cupo ? `${e.cupo.zona?.nombre ?? ''} · ${e.cupo.numeroCupo}` : null,
      }
    })

    return { total_dentro: vehiculos.length, vehiculos }
  }

  async getOcupacionSimple(sedeId: number) {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const dentro = await this.accesoRepo
      .createQueryBuilder('a')
      .where('a.sedeId = :sedeId',    { sedeId })
      .andWhere('a.tipoAcceso = :tipo', { tipo: 'ENTRADA' })
      .andWhere('a.resultado = :r',    { r: ResultadoVerificacion.AUTORIZADO })
      .andWhere('a.fechaHora >= :cutoff', { cutoff })
      .andWhere(`NOT EXISTS (
        SELECT 1 FROM parking_accesos s
        WHERE s.placa = a.placa
          AND s.sede_id = a.sede_id
          AND s.tipo_acceso = 'SALIDA'
          AND s.fecha_hora > a.fecha_hora
          AND s.deleted_at IS NULL
      )`)
      .distinct(true)
      .getCount()

    return { sede_id: sedeId, vehiculos_dentro: dentro }
  }
}
