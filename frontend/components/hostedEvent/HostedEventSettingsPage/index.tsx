"use client";

import { InviteLink } from "./InviteLink";
import { VotingDeadline } from "./VotingDeadline";
import { DangerZone } from "./DangerZone";

export default function HostedEventSettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <InviteLink />
      <VotingDeadline />
      <DangerZone />
    </div>
  );
}
