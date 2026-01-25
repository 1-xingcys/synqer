import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EventSharedModule } from '../shared/event-shared.module';

// Controller
import { ParticipationController } from './participation.controller';

// Services
import { ParticipantService } from './services/participant.service';

// Repositories
import { ParticipantRepository } from './repositories/participant.repository';

@Module({
  imports: [PrismaModule, EventSharedModule],
  controllers: [ParticipationController],
  providers: [ParticipantService, ParticipantRepository],
})
export class ParticipationModule {}
