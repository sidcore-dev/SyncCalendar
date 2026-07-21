"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { createPlan } from "@/lib/actions";
import { setMemberSession } from "@/lib/member-session";
import type { Budget } from "@/lib/types";

export function CreatePlanForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hostName, setHostName] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  const [budget, setBudget] = useState<Budget>("medium");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !hostName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { planId, memberId } = await createPlan({
        hostName,
        name,
        description,
        location,
        dateRangeStart: dateRangeStart || undefined,
        dateRangeEnd: dateRangeEnd || undefined,
        budget,
      });
      setMemberSession({ memberId, planId, name: hostName.trim(), isHost: true });
      router.push(`/plan/${planId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
    >
      <Card>
        <CardContent className="pt-6 sm:pt-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="plan-name">Plan name</Label>
                <Input
                  id="plan-name"
                  placeholder="Beach weekend"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={80}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="host-name">Your name</Label>
                <Input
                  id="host-name"
                  placeholder="e.g. Sid"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  maxLength={40}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="plan-description">Description</Label>
              <Textarea
                id="plan-description"
                placeholder="What's the occasion?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={280}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="plan-location">Location</Label>
                <Input
                  id="plan-location"
                  placeholder="Optional"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  maxLength={120}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Budget</Label>
                <Select value={budget} onValueChange={(v) => setBudget(v as Budget)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="low">$ Low</SelectItem>
                    <SelectItem value="medium">$$ Medium</SelectItem>
                    <SelectItem value="high">$$$ High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Date range (optional)</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="date"
                  value={dateRangeStart}
                  onChange={(e) => setDateRangeStart(e.target.value)}
                  aria-label="Start date"
                />
                <Input
                  type="date"
                  value={dateRangeEnd}
                  onChange={(e) => setDateRangeEnd(e.target.value)}
                  aria-label="End date"
                  min={dateRangeStart || undefined}
                />
              </div>
              <p className="text-xs text-neutral-400">
                Leave blank to default to the next 14 days.
              </p>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button
              type="submit"
              size="lg"
              disabled={loading || !name.trim() || !hostName.trim()}
              className="mt-2 w-full"
            >
              {loading ? "Creating…" : "Create plan"}
              {!loading && <ArrowRight className="size-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
