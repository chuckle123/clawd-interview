import { Circle } from "lucide-react";

type Interview = {
  id: number;
  interviewDate: string | null;
  interviewTime: string | null;
  type: string | null;
  durationMinutes: number | null;
  companyName: string;
  companySlug: string;
};

type ActionItem = {
  id: number;
  description: string;
  dueDate: string | null;
  companyName: string | null;
};

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

function formatDayHeader(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.toLocaleDateString("en-US", { weekday: "short" });
  const month = d.toLocaleDateString("en-US", { month: "short" });
  return `${day} ${month} ${d.getDate()}`;
}

function formatTimeAmPm(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${mStr} ${suffix}`;
}

export function DayTimeline({
  days,
  interviews,
  actionItems,
}: {
  days: string[];
  interviews: Interview[];
  actionItems: ActionItem[];
}) {
  return (
    <div className="space-y-1">
      {days.map((dateStr) => {
        const dayInterviews = interviews.filter(
          (iv) => iv.interviewDate === dateStr
        );
        const dayActions = actionItems.filter(
          (ai) => ai.dueDate === dateStr
        );
        const empty = dayInterviews.length === 0 && dayActions.length === 0;
        const today = isToday(dateStr);

        return (
          <div key={dateStr}>
            {/* Day header */}
            <div className="flex items-center gap-3 py-2">
              <span
                className={`text-sm font-medium whitespace-nowrap ${
                  today
                    ? "text-[var(--accent-blue)]"
                    : "text-[var(--muted-foreground)]"
                }`}
              >
                {formatDayHeader(dateStr)}
              </span>
              <div className="h-px flex-1 bg-[var(--border)]" />
              {today && (
                <span className="text-xs font-medium text-[var(--accent-blue)]">
                  Today
                </span>
              )}
            </div>

            {/* Items */}
            {empty ? (
              <div className="pl-6 pb-2 text-xs text-[var(--muted-foreground)]">
                No events
              </div>
            ) : (
              <div className="space-y-2 pl-2 pb-3">
                {dayInterviews.map((iv) => (
                  <div
                    key={`iv-${iv.id}`}
                    className="flex gap-3 border-l-2 border-[var(--accent-blue)] pl-3 py-1"
                  >
                    <span className="text-sm font-mono tabular-nums text-[var(--muted-foreground)] w-16 shrink-0">
                      {iv.interviewTime
                        ? formatTimeAmPm(iv.interviewTime)
                        : "TBD"}
                    </span>
                    <div>
                      <div className="text-sm font-medium">
                        {iv.companyName} &mdash; {iv.type ?? "Interview"}
                      </div>
                      {iv.durationMinutes && (
                        <div className="text-xs text-[var(--muted-foreground)]">
                          {iv.durationMinutes} min
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {dayActions.map((ai) => (
                  <div
                    key={`ai-${ai.id}`}
                    className="flex items-start gap-3 border-l-2 border-[var(--accent-amber)] pl-3 py-1"
                  >
                    <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent-amber)]" />
                    <div>
                      <div className="text-sm">{ai.description}</div>
                      {ai.companyName && (
                        <div className="text-xs text-[var(--muted-foreground)]">
                          {ai.companyName}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
