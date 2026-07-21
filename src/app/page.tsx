import { CreatePlanForm } from "@/components/create-plan-form";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-16 sm:py-24">
      <div className="mb-10 flex flex-col items-center text-center">
        <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-neutral-900 text-2xl text-white shadow-sm">
          ✦
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
          Sync
        </h1>
        <p className="mt-3 max-w-sm text-balance text-neutral-500">
          Make plans with a group without the endless back-and-forth. Share a link, everyone
          marks when they&rsquo;re free, and Sync finds the best time.
        </p>
      </div>
      <CreatePlanForm />
    </div>
  );
}
