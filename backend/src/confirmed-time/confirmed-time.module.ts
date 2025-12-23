import { Module } from '@nestjs/common';
import { ConfirmedTimeService } from './confirmed-time.service';

@Module({
  providers: [ConfirmedTimeService],
  exports: [ConfirmedTimeService],
})
export class ConfirmedTimeModule {}
