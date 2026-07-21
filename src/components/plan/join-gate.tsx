"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { joinPlan } from "@/lib/actions";
import type { Plan } from "@/lib/types";

export function JoinGate({
  plan,
  onJoined,
}: {
  plan: Pick<Plan, "id" | "name" | "description" | "location">;
  onJoined: (memberId: string, name: string) => void;
}) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { memberId } = await joinPlan({ planId: plan.id, name });
      onJoined(memberId, name.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-violet-500">You&rsquo;re invited</p>
            <CardTitle className="text-2xl">{plan.name}</CardTitle>
            {plan.description && <CardDescription>{plan.description}</CardDescription>}
            {plan.location && (
              <CardDescription className="text-neutral-600">📍 {plan.location}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="join-name">What&rsquo;s your name?</Label>
                <Input
                  id="join-name"
                  autoFocus
                  placeholder="e.g. Priya"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={40}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" disabled={loading || !name.trim()} className="w-full">
                {loading ? "Joining…" : "Join plan"}
              </Button>
              <p className="text-center text-xs text-neutral-400">
                No account needed — just your name.
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
