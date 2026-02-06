import { api } from "@nutricodex/backend";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { Pencil } from "lucide-react";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { authClient } from "~/lib/auth-client";
import { resetHouseholdVerification } from "~/routes/_authenticated";

export const Route = createFileRoute("/_authenticated/household")({
  component: HouseholdPage,
});

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type HouseholdMember = {
  _id: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
};

function HouseholdPage() {
  const household = useQuery(api.households.getMyHousehold);
  const members = useQuery(
    api.households.getHouseholdMembers,
    household ? { householdId: household._id } : "skip",
  );

  if (household === undefined) {
    return <HouseholdPageSkeleton />;
  }

  if (household === null) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Household</h1>
        <p className="text-muted-foreground">You are not a member of any household.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <HouseholdNameSection householdName={household.name} />

      <Separator />

      <MembersSection members={members} />

      <Separator />

      <LeaveHouseholdSection householdName={household.name} members={members} />
    </div>
  );
}

function HouseholdPageSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Skeleton className="h-8 w-48" />
      <Separator />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    </div>
  );
}

function HouseholdNameSection({ householdName }: { householdName: string }) {
  const updateHousehold = useMutation(api.households.updateHousehold);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(householdName);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleStartEditing = () => {
    setEditName(householdName);
    setError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    setError(null);

    const trimmed = editName.trim();
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
      await updateHousehold({ name: trimmed });
      setIsEditing(false);
    } catch (err) {
      const message =
        (err as { data?: string })?.data ??
        (err as Error)?.message ??
        "Failed to update household name";
      setError(message);
    } finally {
      setIsPending(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Household name"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSave();
              } else if (e.key === "Escape") {
                handleCancel();
              }
            }}
          />
          <Button size="sm" disabled={isPending} onClick={handleSave}>
            {isPending ? "Saving..." : "Save"}
          </Button>
          <Button size="sm" variant="outline" disabled={isPending} onClick={handleCancel}>
            Cancel
          </Button>
        </div>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <h1 className="text-2xl font-bold">{householdName}</h1>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleStartEditing}
        aria-label="Edit household name"
      >
        <Pencil className="size-4" />
      </Button>
    </div>
  );
}

function MembersSection({ members }: { members: HouseholdMember[] | undefined }) {
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Members</CardTitle>
      </CardHeader>
      <CardContent>
        {members === undefined ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {members.map((member) => {
              const displayName = member.name || member.email;
              const fallback = member.name
                ? getInitials(member.name)
                : member.email?.charAt(0).toUpperCase() || "?";
              const isCurrentUser = member.userId === currentUserId;

              return (
                <div key={member._id} className="flex items-center gap-3">
                  <Avatar>
                    {member.image && <AvatarImage src={member.image} alt={displayName} />}
                    <AvatarFallback>{fallback}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {displayName}
                      {isCurrentUser && <span className="ml-1 text-muted-foreground">(You)</span>}
                    </span>
                    {member.name && member.email && (
                      <span className="text-xs text-muted-foreground">{member.email}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LeaveHouseholdSection({
  householdName,
  members,
}: {
  householdName: string;
  members: HouseholdMember[] | undefined;
}) {
  const navigate = useNavigate();
  const leaveHousehold = useMutation(api.households.leaveHousehold);

  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const isLastMember = members !== undefined && members.length === 1;

  const handleLeave = async () => {
    setError(null);
    setIsPending(true);
    try {
      await leaveHousehold();
      resetHouseholdVerification();
      navigate({ to: "/onboarding" });
    } catch (err) {
      const message =
        (err as { data?: string })?.data ?? (err as Error)?.message ?? "Failed to leave household";
      setError(message);
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">Leave Household</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Household?</AlertDialogTitle>
            <AlertDialogDescription>
              You will leave {householdName}.
              {isLastMember && " Since you are the last member, the household will be deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={isPending} onClick={handleLeave}>
              {isPending ? "Leaving..." : "Leave & Continue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
