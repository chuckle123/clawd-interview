import { Circle } from "lucide-react";

type ActionItem = {
  id: number;
  description: string;
  dueDate: string | null;
  completed: number;
  companyName: string | null;
  companySlug: string | null;
};

export function ActionItemList({ items }: { items: ActionItem[] }) {
  if (items.length === 0) {
    return (
      <div className="text-sm text-[var(--muted-foreground)] py-4 text-center">
        No pending action items.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-[var(--border)]">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-3 py-3">
          <Circle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
          <div className="flex-1 min-w-0">
            <p className="text-sm">{item.description}</p>
            <div className="flex gap-3 text-xs text-[var(--muted-foreground)] mt-0.5">
              {item.companyName && <span>{item.companyName}</span>}
              {item.dueDate && (
                <span
                  className={
                    item.dueDate < new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" })
                      ? "text-red-500"
                      : ""
                  }
                >
                  Due {item.dueDate}
                </span>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
