import { Users } from "lucide-react";

export function ResponseCounter({
  responded,
  total,
}: {
  responded: number;
  total: number;
}) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-[13px] font-medium text-neutral-600">
      <Users className="size-3.5" />
      <span>
        {responded}/{total} responded
      </span>
    </div>
  );
}
