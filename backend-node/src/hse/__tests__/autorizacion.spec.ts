import { Test, TestingModule } from '@nestjs/testing';
import { AutorizacionService } from '../services/autorizacion.service';
import { CodigoGeneratorService } from '../services/codigo-generator.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HseAutorizacion } from '../entities/hse-autorizacion.entity';
import { DataSource } from 'typeorm';
import { EstadoAutorizacion } from '../../common/enums/hse.enum';
import { BadRequestException } from '@nestjs/common';

import { AutorizacionValidator } from '../validators/autorizacion.validator';
import { HseContratista } from '../entities/hse-contratista.entity';
import { HseHistorial } from '../entities/hse-historial.entity';

describe('AutorizacionService', () => {
  let service: AutorizacionService;
  let dataSourceMock: any;
  let qrMock: any;

  beforeEach(async () => {
    qrMock = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      manager: {
        create: jest.fn(),
        save: jest.fn(),
      },
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
    };

    dataSourceMock = {
      createQueryRunner: jest.fn().mockReturnValue(qrMock),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutorizacionService,
        {
          provide: CodigoGeneratorService,
          useValue: { generarCodigo: jest.fn().mockResolvedValue('HSE-2023-0001') },
        },
        {
          provide: getRepositoryToken(HseAutorizacion),
          useValue: {
            find: jest.fn(),
            findAndCount: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            create: jest.fn().mockImplementation((dto) => dto),
          },
        },
        {
          provide: getRepositoryToken(HseContratista),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            softRemove: jest.fn(),
            create: jest.fn().mockImplementation((dto) => dto),
          },
        },
        {
          provide: getRepositoryToken(HseHistorial),
          useValue: {
            save: jest.fn(),
            create: jest.fn().mockImplementation((dto) => dto),
          },
        },
        {
          provide: AutorizacionValidator,
          useValue: { validarFechas: jest.fn() },
        },
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
      ],
    }).compile();

    service = module.get<AutorizacionService>(AutorizacionService);

    // Mock findOne to avoid infinite recursion or actual DB calls
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 1 } as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an autorizacion and contratistas within a transaction', async () => {
      const dto = {
        empresaContratista: 'Test Corp',
        nit: '123456',
        sedeId: 1,
        fechaInicio: '2023-01-01',
        fechaFin: '2023-12-31',
        contratistas: [{ nombreCompleto: 'Juan Perez', tipoDocumento: 'CC' as any, numeroDocumento: '123' }],
      };

      qrMock.manager.save.mockResolvedValueOnce({ id: 1 }); // Save Aut
      qrMock.manager.save.mockResolvedValueOnce([{ id: 1 }]); // Save Contratistas

      const result = await service.create(dto as any, 1);

      expect(qrMock.startTransaction).toHaveBeenCalled();
      expect(qrMock.manager.save).toHaveBeenCalledTimes(2);
      expect(qrMock.commitTransaction).toHaveBeenCalled();
      expect(qrMock.release).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
    });

    it('should rollback transaction on error', async () => {
      const dto = {
        empresaContratista: 'Test Corp',
        nit: '123456',
        sedeId: 1,
        fechaInicio: '2023-01-01',
        fechaFin: '2023-12-31',
        contratistas: [{ nombreCompleto: 'Juan Perez', tipoDocumento: 'CC' as any, numeroDocumento: '123' }],
      };

      qrMock.manager.save.mockRejectedValueOnce(new Error('DB Error'));

      await expect(service.create(dto as any, 1)).rejects.toThrow('DB Error');
      expect(qrMock.rollbackTransaction).toHaveBeenCalled();
      expect(qrMock.release).toHaveBeenCalled();
    });
  });
});
