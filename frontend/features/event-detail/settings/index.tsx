"use client";

import { InviteLink } from "./InviteLink";
import { VotingDeadline } from "./voting-deadline";
import { GridDefaultSection, VoteNoticeSection } from "./event-preference";
import { DeleteEvent } from "./delete-event";

export default function SettingsTab() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <InviteLink />
      <VotingDeadline />
      <VoteNoticeSection />
      <GridDefaultSection />
      <DeleteEvent />
    </div>
  );
}
