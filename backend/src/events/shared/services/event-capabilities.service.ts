import { Injectable } from '@nestjs/common';
import { EventType } from '@prisma/client';
import { EventCapabilities } from '../interfaces/event-contract.interface';

@Injectable()
export class EventCapabilitiesService {
  buildCapabilities(eventType: EventType): EventCapabilities {
    if (eventType === EventType.RECURRING) {
      return {
        supportsCompletion: false,
        supportsCalendarConflict: false,
        supportsAddToCalendar: false,
      };
    }

    return {
      supportsCompletion: true,
      supportsCalendarConflict: true,
      supportsAddToCalendar: true,
    };
  }
}
