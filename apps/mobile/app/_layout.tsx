import { PortalHost } from "@rn-primitives/portal";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Slot } from "expo-router";
import "../src/global.css";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("Missing EXPO_PUBLIC_CONVEX_URL environment variable");
}
const convex = new ConvexReactClient(convexUrl);

export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <Slot />
      <PortalHost />
    </ConvexProvider>
  );
}
