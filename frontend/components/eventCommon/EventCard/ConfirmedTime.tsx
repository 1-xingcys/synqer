import { format } from "date-fns";

interface ConfirmedTimeProps {
  confirmedStartTime: string;
}

export default function ConfirmedTime({
  confirmedStartTime,
}: ConfirmedTimeProps) {
  return (
    <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      {format(new Date(confirmedStartTime), "MMM d, HH:mm")}
    </span>
  );
}
