import { describe, expect, it } from "@jest/globals";
import { buildVotingDeadlineFormData } from "@/components/hostedEvent/HostedEventSettingsPage/useEventSettings";

describe("buildVotingDeadlineFormData", () => {
  it("reads the naive votingDeadline's wall-clock digits via UTC fields, not local getters", () => {
    // votingDeadline is stored naive: UTC fields carry the wall-clock digits
    // (date 2026-07-14, time 02:00) for the event's time zone. Reading them
    // via local Date getters is only correct when the test runner's local
    // TZ happens to be UTC — run this suite under TZ=America/Los_Angeles to
    // catch the regression (local getters would read 2026-07-13 19:00
    // instead of the correct 2026-07-14 02:00).
    const result = buildVotingDeadlineFormData("2026-07-14T02:00:00.000Z");

    expect(result.deadlineEnabled).toBe(true);
    expect(result.deadlineTime).toBe("02:00");
    expect(result.deadlineDate?.getFullYear()).toBe(2026);
    expect(result.deadlineDate?.getMonth()).toBe(6); // July (0-indexed)
    expect(result.deadlineDate?.getDate()).toBe(14);
  });

  it("returns disabled form data when votingDeadline is null", () => {
    const result = buildVotingDeadlineFormData(null);

    expect(result).toEqual({
      deadlineEnabled: false,
      deadlineDate: null,
      deadlineTime: null,
    });
  });
});
