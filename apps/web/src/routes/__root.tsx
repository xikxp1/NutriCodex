import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import type { ConvexQueryClient } from "@convex-dev/react-query";
import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Toaster } from "~/components/ui/sonner";
import { TooltipProvider } from "~/components/ui/tooltip";
import { authClient } from "~/lib/auth-client";
import { getToken } from "~/lib/auth-server";

export const getAuth = createServerFn({ method: "GET" }).handler(async () => {
  const token = await getToken();
  return token ?? null;
});

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  convexQueryClient: ConvexQueryClient;
}>()({
  beforeLoad: async ({ context }) => {
    const token = await getAuth();
    if (token) {
      context.convexQueryClient.serverHttpClient?.setAuth(token);
    }
    return { token };
  },
  component: RootComponent,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "NutriCodex" },
    ],
    links: [{ rel: "stylesheet", href: "/src/styles/globals.css" }],
  }),
});

function RootComponent() {
  const { convexQueryClient, token } = Route.useRouteContext();
  return (
    <ConvexBetterAuthProvider
      client={convexQueryClient.convexClient}
      authClient={authClient}
      initialToken={token}
    >
      <html lang="en">
        <head>
          <HeadContent />
        </head>
        <body>
          <TooltipProvider>
            <Outlet />
          </TooltipProvider>
          <Toaster position="top-right" offset={{ top: "9rem" }} />
          <Scripts />
        </body>
      </html>
    </ConvexBetterAuthProvider>
  );
}
