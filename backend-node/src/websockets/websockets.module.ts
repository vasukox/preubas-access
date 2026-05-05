import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { KoajGateway } from './koaj.gateway';

/**
 * WebsocketsModule — gestiona las conexiones WebSocket de tiempo real.
 *
 * Provee KoajGateway al resto de la aplicación para que
 * los servicios puedan hacer broadcast de eventos.
 */
@Module({
  imports: [
    ConfigModule,
    // JwtModule para verificar tokens de conexión WS
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.jwtSecret,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [KoajGateway],
  exports: [KoajGateway],
})
export class WebsocketsModule {}
