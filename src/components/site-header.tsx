import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 pt-6">
      <Link href="/" className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-900 text-sm text-white">
          ✦
        </div>
        <span className="font-semibold tracking-tight text-neutral-900">Sync</span>
      </Link>
      <Button asChild variant="outline" size="sm">
        <Link href="/">
          <Plus className="size-3.5" />
          New plan
        </Link>
      </Button>
    </div>
  );
}
