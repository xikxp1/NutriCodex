import { api } from "@nutricodex/backend";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import { AppSidebar } from "~/components/layout/app-sidebar";
import { TopBar } from "~/components/layout/top-bar";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { fetchAuthQuery } from "~/lib/auth-server";

export const getHouseholdStatus = createServerFn({ method: "GET" }).handler(async () => {
  const household = await fetchAuthQuery(api.households.getMyHousehold, {});
  return household;
});

// Track whether the household check has passed on the client.
// Resets on full page reload (SSR re-validates from scratch).
let clientHouseholdVerified = false;

export function resetHouseholdVerification() {
  clientHouseholdVerified = false;
}

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context, location }) => {
    if (typeof window === "undefined") {
      // SSR: use token from root context (already fetched there, no duplicate call)
      if (!context.token) {
        throw redirect({
          to: "/login",
          search: { redirect: location.href },
        });
      }
      context.convexQueryClient.serverHttpClient?.setAuth(context.token);

      const household = await getHouseholdStatus();
      if (!household) {
        throw redirect({ to: "/onboarding" });
      }
      return;
    }

    // Client-side: skip if household was already verified this session
    if (clientHouseholdVerified) return;

    // First client-side visit (e.g. after login): verify household once
    const household = await getHouseholdStatus();
    if (!household) {
      throw redirect({ to: "/onboarding" });
    }
    clientHouseholdVerified = true;
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <TopBar />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
