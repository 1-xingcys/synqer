"use client";

import { InviteLink } from "./InviteLink";
import { VotingDeadline } from "./VotingDeadline";
import { EventPreference } from "./EventPreference";
import { DeleteEvent } from "./DeleteEvent";

export default function HostedEventSettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <InviteLink />
      <VotingDeadline />
      <EventPreference />
      <DeleteEvent />
    </div>
  );
}
