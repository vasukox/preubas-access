import { Test, TestingModule } from '@nestjs/testing';
import { AutogestionService } from '../services/autogestion.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HseContratista } from '../entities/hse-contratista.entity';
import { HseClasificacion } from '../entities/hse-clasificacion.entity';
import { HseSegSocial } from '../entities/hse-seg-social.entity';
import { HseCertificaciones } from '../entities/hse-certificaciones.entity';
import { HseExamenMedico } from '../entities/hse-examen-medico.entity';
import { HseContactoEmergencia } from '../entities/hse-contacto-emergencia.entity';
import { HseAceptacionNormas } from '../entities/hse-aceptacion-normas.entity';
import { HseAutorizacion } from '../entities/hse-autorizacion.entity';
import { HseHistorial } from '../entities/hse-historial.entity';
import { EstadoContratista } from '../../common/enums/hse.enum';

describe('AutogestionService', () => {
  let service: AutogestionService;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      insert: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutogestionService,
        { provide: getRepositoryToken(HseContratista), useValue: mockRepo },
        { provide: getRepositoryToken(HseClasificacion), useValue: mockRepo },
        { provide: getRepositoryToken(HseSegSocial), useValue: mockRepo },
        { provide: getRepositoryToken(HseCertificaciones), useValue: mockRepo },
        { provide: getRepositoryToken(HseExamenMedico), useValue: mockRepo },
        { provide: getRepositoryToken(HseContactoEmergencia), useValue: mockRepo },
        { provide: getRepositoryToken(HseAceptacionNormas), useValue: mockRepo },
        { provide: getRepositoryToken(HseAutorizacion), useValue: mockRepo },
        { provide: getRepositoryToken(HseHistorial), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<AutogestionService>(AutogestionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('guardarClasificacion', () => {
    it('should upsert clasificacion data', async () => {
      mockRepo.update.mockResolvedValue(true);
      mockRepo.findOne.mockResolvedValue({ id: 1, contratistaId: 1 });

      const result = await service.guardarClasificacion(1, {} as any);
      expect(mockRepo.update).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('finalizarAutogestion', () => {
    it('should change contractor state to AUTOGESTION_COMPLETADA', async () => {
      const contratista = { id: 1, estado: EstadoContratista.PENDIENTE_AUTOGESTION };
      mockRepo.findOne.mockResolvedValue(contratista);
      mockRepo.save.mockResolvedValue({ ...contratista, estado: EstadoContratista.AUTOGESTION_COMPLETADA });

      const result = await service.finalizarAutogestion(1);
      
      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockRepo.save).toHaveBeenCalled();
      expect(contratista.estado).toBe(EstadoContratista.AUTOGESTION_COMPLETADA);
      expect(result.success).toBe(true);
    });

    it('should throw if contractor not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.finalizarAutogestion(999)).rejects.toThrow('Contratista no encontrado');
    });
  });
});
