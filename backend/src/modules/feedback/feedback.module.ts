import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedbackEntity } from '../../database/entities/release1.entity';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { FeedbackController } from './feedback.controller';
import { FeedbackGateway } from './feedback.gateway';
import { FeedbackService } from './feedback.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FeedbackEntity]),
    AuditLogModule,
    // The gateway verifies handshake tokens itself — passport guards do not run
    // on websocket connections — so it needs the same secret the HTTP side uses.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({ secret: config.getOrThrow<string>('JWT_SECRET') }),
    }),
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService, FeedbackGateway],
})
export class FeedbackModule {}
