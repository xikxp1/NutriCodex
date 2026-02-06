import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { Sidebar, SidebarContent, SidebarInset, SidebarProvider } from "~/components/ui/sidebar";

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
      <Sidebar collapsible="icon">
        <SidebarContent />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <span className="text-sm font-medium">NutriCodex</span>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
