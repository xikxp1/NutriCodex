import { api } from "@nutricodex/backend";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import { AppSidebar } from "~/components/layout/app-sidebar";
import { TopBar } from "~/components/layout/top-bar";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { fetchAuthQuery } from "~/lib/auth-server";

import { getAuth } from "./__root";

export const getHouseholdStatus = createServerFn({ method: "GET" }).handler(async () => {
  const household = await fetchAuthQuery(api.households.getMyHousehold, {});
  return household;
});

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context, location }) => {
    const token = await getAuth();
    if (!token) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
    context.convexQueryClient.serverHttpClient?.setAuth(token);

    const household = await getHouseholdStatus();
    if (!household) {
      // The /onboarding route is created in a separate subtask (sub-04).
      // Using `as string` to satisfy the router's strict route type checking
      // until the route file is added and route types are regenerated.
      throw redirect({
        to: "/onboarding" as string,
      });
    }
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
