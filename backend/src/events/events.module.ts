import { Module } from '@nestjs/common';

// Sub-modules
import { EventSharedModule } from './shared/event-shared.module';
import { EventCoreModule } from './core/event-core.module';
import { ParticipationModule } from './participation/participation.module';
import { VotingModule } from './voting/voting.module';
import { ConfirmationModule } from './confirmation/confirmation.module';

@Module({
  imports: [
    EventSharedModule,
    EventCoreModule,
    ParticipationModule,
    VotingModule,
    ConfirmationModule,
  ],
})
export class EventsModule {}
