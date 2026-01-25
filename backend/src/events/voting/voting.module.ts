import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EventSharedModule } from '../shared/event-shared.module';

// Controller
import { VotingController } from './voting.controller';

// Services
import { VoteService } from './services/vote.service';

// Repositories
import { VoteRepository } from './repositories/vote.repository';

@Module({
  imports: [PrismaModule, EventSharedModule],
  controllers: [VotingController],
  providers: [VoteService, VoteRepository],
})
export class VotingModule {}
