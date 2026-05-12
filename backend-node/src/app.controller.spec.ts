import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { ConfigService } from './config/config.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            appName: 'KOAJ Access API',
            appVersion: 'test',
            nodeEnv: 'test',
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return API info', () => {
      expect(appController.getInfo()).toEqual({
        name: 'KOAJ Access API',
        version: 'test',
        environment: 'test',
        docs: '/api/v1/health',
      });
    });
  });
});
