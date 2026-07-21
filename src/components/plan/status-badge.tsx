import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type MemberStatus = "available" | "busy" | "pending";

const STATUS_META: Record<MemberStatus, { label: string }> = {
  available: { label: "Available" },
  busy: { label: "Busy" },
  pending: { label: "Pending" },
};

export function StatusBadge({
  status,
  className,
}: {
  status: MemberStatus;
  className?: string;
}) {
  return (
    <Badge variant={status} className={cn(className)}>
      {STATUS_META[status].label}
    </Badge>
  );
}
