import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Member } from "@/lib/types";

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function MemberList({ members }: { members: Member[] }) {
  if (members.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {members.map((member) => (
        <div key={member.id} className="flex items-center gap-2">
          <div className="relative">
            <Avatar className={cn(member.is_host && "ring-2 ring-violet-200")}>
              <AvatarFallback>{initials(member.name)}</AvatarFallback>
            </Avatar>
            <span
              className={cn(
                "absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white",
                member.responded_at ? "bg-emerald-500" : "bg-amber-400"
              )}
              title={member.responded_at ? "Responded" : "Pending"}
            />
          </div>
          <span className="text-sm text-neutral-700">
            {member.name}
            {member.is_host && <span className="ml-1 text-xs text-violet-500">host</span>}
          </span>
        </div>
      ))}
    </div>
  );
}
