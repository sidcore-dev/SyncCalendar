import { cache } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlanView } from "@/components/plan/plan-view";
import { SiteHeader } from "@/components/site-header";
import type { PlanBundle } from "@/lib/types";

const getPlanBundle = cache(async (id: string): Promise<PlanBundle | null> => {
  const supabase = await createClient();

  const { data: plan } = await supabase.from("plans").select("*").eq("id", id).single();
  if (!plan) return null;

  const [{ data: members }, { data: availability }, { data: votes }] = await Promise.all([
    supabase.from("members").select("*").eq("plan_id", id).order("created_at"),
    supabase.from("availability").select("*").eq("plan_id", id),
    supabase.from("votes").select("*").eq("plan_id", id),
  ]);

  return {
    plan,
    members: members ?? [],
    availability: availability ?? [],
    votes: votes ?? [],
  };
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bundle = await getPlanBundle(id);
  return { title: bundle ? `${bundle.plan.name} · Sync` : "Plan not found · Sync" };
}

export default async function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bundle = await getPlanBundle(id);
  if (!bundle) notFound();

  return (
    <>
      <SiteHeader />
      <PlanView initialBundle={bundle} />
    </>
  );
}
