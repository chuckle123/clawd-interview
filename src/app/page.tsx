import { getInterviewsInRange, getPendingActionItems, getActionItemsInRange } from "@/db/queries";
import { DayTimeline } from "@/components/calendar-week-view";
import { ActionItemList } from "@/components/action-item-list";

function todayET(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

function getLookaheadRange(): { startStr: string; endStr: string } {
  const startStr = todayET();
  const end = new Date(startStr + "T12:00:00");
  end.setDate(end.getDate() + 30);
  return {
    startStr,
    endStr: end.toISOString().split("T")[0],
  };
}

function getActiveDays(
  todayStr: string,
  interviews: { interviewDate: string | null }[],
  actionItems: { dueDate: string | null }[],
): string[] {
  const datesWithEvents = new Set<string>();
  for (const iv of interviews) {
    if (iv.interviewDate && iv.interviewDate >= todayStr) datesWithEvents.add(iv.interviewDate);
  }
  for (const ai of actionItems) {
    if (ai.dueDate && ai.dueDate >= todayStr) datesWithEvents.add(ai.dueDate);
  }
  // Always include today, then up to 3 more days with events
  const futureDays = [...datesWithEvents]
    .filter((d) => d > todayStr)
    .sort();
  const days = [todayStr, ...futureDays.slice(0, 3)];
  return days;
}

export const dynamic = "force-dynamic";

export default function HomePage() {
  const { startStr, endStr } = getLookaheadRange();

  const interviews = getInterviewsInRange(startStr, endStr);
  const actionItemsForCalendar = getActionItemsInRange(startStr, endStr);
  const pendingActionItems = getPendingActionItems();

  const todayStr = startStr;
  const activeDays = getActiveDays(todayStr, interviews, actionItemsForCalendar);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Job Search OS</h1>
        <p className="text-[var(--muted-foreground)] text-sm mt-1">
          {new Date().toLocaleDateString("en-US", {
            timeZone: "America/New_York",
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">Upcoming</h2>
        <DayTimeline
          days={activeDays}
          interviews={interviews}
          actionItems={actionItemsForCalendar}
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">
          Action Items ({pendingActionItems.length})
        </h2>
        <ActionItemList items={pendingActionItems} />
      </section>
    </div>
  );
}
