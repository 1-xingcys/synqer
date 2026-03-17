import * as dotenv from 'dotenv';
import { PrismaClient, EventType, EventSlotAxisType } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();
const isDryRun = process.argv.includes('--dry-run');

type Phase1Stats = {
  oneTimeEvents: number;
  existingOneTimeSchedules: number;
  missingOneTimeSchedules: number;
  slotsMissingAxisDate: number;
  slotsReady: number;
};

async function collectStats(): Promise<Phase1Stats> {
  const [
    oneTimeEvents,
    existingOneTimeSchedules,
    missingOneTimeSchedules,
    slotsMissingAxisDate,
    slotsReady,
  ] = await Promise.all([
    prisma.event.count({
      where: {
        type: EventType.ONE_TIME,
      },
    }),
    prisma.oneTimeEventSchedule.count(),
    prisma.event.count({
      where: {
        type: EventType.ONE_TIME,
        oneTimeSchedule: {
          is: null,
        },
      },
    }),
    prisma.eventTimeSlot.count({
      where: {
        axisDate: null,
      },
    }),
    prisma.eventTimeSlot.count({
      where: {
        axisType: EventSlotAxisType.DATE,
        axisDate: {
          not: null,
        },
      },
    }),
  ]);

  return {
    oneTimeEvents,
    existingOneTimeSchedules,
    missingOneTimeSchedules,
    slotsMissingAxisDate,
    slotsReady,
  };
}

function printStats(label: string, stats: Phase1Stats) {
  console.log(`\n[${label}]`);
  console.log(`one-time events: ${stats.oneTimeEvents}`);
  console.log(`existing one-time schedules: ${stats.existingOneTimeSchedules}`);
  console.log(`missing one-time schedules: ${stats.missingOneTimeSchedules}`);
  console.log(`slots missing axisDate: ${stats.slotsMissingAxisDate}`);
  console.log(`slots ready with DATE axis: ${stats.slotsReady}`);
}

async function backfillOneTimeSchedules() {
  const events = await prisma.event.findMany({
    where: {
      type: EventType.ONE_TIME,
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      startMinuteOfDay: true,
      endMinuteOfDay: true,
      slotDurationMin: true,
    },
  });

  if (events.length === 0) {
    return { count: 0 };
  }

  return prisma.oneTimeEventSchedule.createMany({
    data: events.map((event) => ({
      eventId: event.id,
      startDate: event.startDate,
      endDate: event.endDate,
      startMinuteOfDay: event.startMinuteOfDay,
      endMinuteOfDay: event.endMinuteOfDay,
      slotDurationMin: event.slotDurationMin,
    })),
    skipDuplicates: true,
  });
}

async function backfillSlotAxisMetadata() {
  return prisma.$executeRawUnsafe(`
    UPDATE "EventTimeSlot"
    SET
      "axisType" = 'DATE'::"EventSlotAxisType",
      "axisDate" = "date",
      "axisWeekday" = NULL
    WHERE "axisDate" IS NULL
  `);
}

async function assertBackfillComplete() {
  const missingOneTimeSchedules = await prisma.event.count({
    where: {
      type: EventType.ONE_TIME,
      oneTimeSchedule: {
        is: null,
      },
    },
  });

  const slotsMissingAxisDate = await prisma.eventTimeSlot.count({
    where: {
      axisDate: null,
    },
  });

  if (missingOneTimeSchedules > 0 || slotsMissingAxisDate > 0) {
    throw new Error(
      `Backfill incomplete: missing schedules=${missingOneTimeSchedules}, slots missing axisDate=${slotsMissingAxisDate}`,
    );
  }
}

async function main() {
  console.log(
    `Starting Phase 1 backfill${isDryRun ? ' (dry-run mode)' : ''}...`,
  );

  const before = await collectStats();
  printStats('before', before);

  if (isDryRun) {
    console.log('\nDry-run only. No data was changed.');
    return;
  }

  const createdSchedules = await backfillOneTimeSchedules();
  const updatedSlots = await backfillSlotAxisMetadata();

  console.log(`\ncreated one-time schedules: ${createdSchedules.count}`);
  console.log(`updated slots with axis metadata: ${updatedSlots}`);

  await assertBackfillComplete();

  const after = await collectStats();
  printStats('after', after);

  console.log('\nPhase 1 backfill completed successfully.');
}

main()
  .catch((error: unknown) => {
    console.error('\nPhase 1 backfill failed.');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
