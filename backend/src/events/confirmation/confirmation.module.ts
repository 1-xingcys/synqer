import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EventSharedModule } from '../shared/event-shared.module';

// Controller
import { ConfirmationController } from './confirmation.controller';

// Services
import { ConfirmationService } from './services/confirmation.service';

// Repositories
import { ConfirmationRepository } from './repositories/confirmation.repository';

@Module({
  imports: [PrismaModule, EventSharedModule],
  controllers: [ConfirmationController],
  providers: [ConfirmationService, ConfirmationRepository],
})
export class ConfirmationModule {}
