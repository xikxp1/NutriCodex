import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AppSidebar } from "~/components/layout/app-sidebar";
import { TopBar } from "~/components/layout/top-bar";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";

import { getAuth } from "./__root";

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
