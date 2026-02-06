import type { Id } from "@nutricodex/backend";
import { api } from "@nutricodex/backend";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Skeleton } from "~/components/ui/skeleton";

import { getAuth } from "./__root";
import { getHouseholdStatus } from "./_authenticated";

export const Route = createFileRoute("/onboarding")({
  beforeLoad: async () => {
    const token = await getAuth();
    if (!token) {
      throw redirect({ to: "/login", search: { redirect: "/onboarding" } });
    }
    const household = await getHouseholdStatus();
    if (household) {
      throw redirect({ to: "/" });
    }
  },
  component: OnboardingPage,
});

function OnboardingPage() {
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm flex flex-col gap-4">
        <div className="flex gap-2">
          <Button
            variant={activeTab === "create" ? "default" : "outline"}
            onClick={() => setActiveTab("create")}
            className="flex-1"
          >
            Create Household
          </Button>
          <Button
            variant={activeTab === "join" ? "default" : "outline"}
            onClick={() => setActiveTab("join")}
            className="flex-1"
          >
            Join Household
          </Button>
        </div>

        {activeTab === "create" ? <CreateHouseholdSection /> : <JoinHouseholdSection />}
      </div>
    </div>
  );
}

function CreateHouseholdSection() {
  const navigate = useNavigate();
  const createHousehold = useMutation(api.households.createHousehold);

  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setError("Household name is required");
      return;
    }
    if (trimmed.length > 100) {
      setError("Household name must be 100 characters or less");
      return;
    }

    setIsPending(true);
    try {
      await createHousehold({ name: trimmed });
      navigate({ to: "/" });
    } catch (err) {
      const message =
        (err as { data?: string })?.data ?? (err as Error)?.message ?? "Failed to create household";
      setError(message);
      setIsPending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Create a Household</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="household-name">Household Name</Label>
            <Input
              id="household-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Smith Family"
              autoComplete="off"
            />
          </div>

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Creating..." : "Create Household"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function JoinHouseholdSection() {
  const navigate = useNavigate();
  const households = useQuery(api.households.listHouseholds);
  const joinHousehold = useMutation(api.households.joinHousehold);

  const [error, setError] = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const handleJoin = async (householdId: Id<"household">) => {
    setError(null);
    setJoiningId(householdId as string);
    try {
      await joinHousehold({ householdId });
      navigate({ to: "/" });
    } catch (err) {
      const message =
        (err as { data?: string })?.data ?? (err as Error)?.message ?? "Failed to join household";
      setError(message);
      setJoiningId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Join a Household</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <p className="text-sm text-destructive mb-4" role="alert">
            {error}
          </p>
        )}

        {households === undefined ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : households.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No households available. Create one instead.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {households.map((household) => (
              <div
                key={household._id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{household.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {household.memberCount} {household.memberCount === 1 ? "member" : "members"}
                  </span>
                </div>
                <Button
                  size="sm"
                  disabled={joiningId !== null}
                  onClick={() => handleJoin(household._id)}
                >
                  {joiningId === (household._id as string) ? "Joining..." : "Join"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
