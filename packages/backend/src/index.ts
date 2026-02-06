// Re-export Convex client utilities for apps

export { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
export { ConvexProvider, ConvexReactClient, useAction, useMutation, useQuery } from "convex/react";

// Re-export typed API (available after `convex dev` generates types)
// Apps should import: import { api } from "@nutricodex/backend"
export { api } from "../convex/_generated/api";
export type { DataModel, Doc, Id } from "../convex/_generated/dataModel";
