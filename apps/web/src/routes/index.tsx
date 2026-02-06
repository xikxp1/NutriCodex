import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";

import { Button } from "~/components/ui/button";
import { authClient } from "~/lib/auth-client";

import { getAuth } from "./__root";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context, location }) => {
    const token = await getAuth();
    if (!token) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
    context.convexQueryClient.serverHttpClient?.setAuth(token);
  },
  component: IndexPage,
});

function IndexPage() {
  const { data, isPending } = authClient.useSession();
  const navigate = useNavigate();

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background">
      <h1 className="text-4xl font-bold">Welcome, {data?.user?.name}</h1>
      <Button
        variant="outline"
        onClick={() => {
          authClient.signOut({
            fetchOptions: {
              onSuccess: () => {
                navigate({ to: "/login", search: { redirect: "/" } });
              },
            },
          });
        }}
      >
        Log Out
      </Button>
    </div>
  );
}
