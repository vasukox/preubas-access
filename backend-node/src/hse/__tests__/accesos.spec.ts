import { Test, TestingModule } from '@nestjs/testing';
import { AccesoService } from '../services/acceso.service';
import { ValidacionService } from '../services/validacion.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HseAcceso } from '../entities/hse-acceso.entity';
import { BadRequestException } from '@nestjs/common';

describe('AccesoService', () => {
  let service: AccesoService;
  let mockAccesoRepo: any;
  let mockValidacionService: any;

  beforeEach(async () => {
    mockAccesoRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((dto) => Promise.resolve({ id: 1, ...dto })),
    };

    mockValidacionService = {
      validarAccesoPermitido: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccesoService,
        { provide: getRepositoryToken(HseAcceso), useValue: mockAccesoRepo },
        { provide: ValidacionService, useValue: mockValidacionService },
      ],
    }).compile();

    service = module.get<AccesoService>(AccesoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registrarEntrada', () => {
    it('should register entrance if allowed and not already inside', async () => {
      mockValidacionService.validarAccesoPermitido.mockResolvedValue(true);
      // Simula que el último acceso fue SALIDA (o no hay accesos previos)
      mockAccesoRepo.findOne.mockResolvedValue(null); 

      const result = await service.registrarEntrada(1, 1, 99, 'Puerta A');

      expect(mockValidacionService.validarAccesoPermitido).toHaveBeenCalledWith(1);
      expect(mockAccesoRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        contratistaId: 1,
        tipoAcceso: 'ENTRADA',
        metodo: 'CEDULA_MANUAL',
      }));
      expect(result.tipoAcceso).toBe('ENTRADA');
    });

    it('should throw if already inside', async () => {
      mockValidacionService.validarAccesoPermitido.mockResolvedValue(true);
      // Simula que el último acceso fue ENTRADA
      mockAccesoRepo.findOne.mockResolvedValue({ tipoAcceso: 'ENTRADA' }); 

      await expect(service.registrarEntrada(1, 1, 99)).rejects.toThrow(BadRequestException);
    });

    it('should propagate validation error', async () => {
      mockValidacionService.validarAccesoPermitido.mockRejectedValue(new BadRequestException('No activo'));

      await expect(service.registrarEntrada(1, 1, 99)).rejects.toThrow('No activo');
    });
  });

  describe('registrarSalida', () => {
    it('should register exit if currently inside', async () => {
      mockAccesoRepo.findOne.mockResolvedValue({ tipoAcceso: 'ENTRADA', sedeId: 1 });

      const result = await service.registrarSalida(1, 1, 99, 'Puerta B');

      expect(mockAccesoRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        tipoAcceso: 'SALIDA',
      }));
      expect(result.tipoAcceso).toBe('SALIDA');
    });

    it('should throw if no pending entrance', async () => {
      mockAccesoRepo.findOne.mockResolvedValue({ tipoAcceso: 'SALIDA' }); // Último fue salida
      await expect(service.registrarSalida(1, 1, 99)).rejects.toThrow(BadRequestException);
    });
  });
});
