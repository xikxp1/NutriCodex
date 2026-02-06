import { Slot } from "expo-router";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { PortalHost } from "@rn-primitives/portal";
import "../src/global.css";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <Slot />
      <PortalHost />
    </ConvexProvider>
  );
}
