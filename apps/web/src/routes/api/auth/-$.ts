// Auth API route handler - proxies auth requests to Convex via Better Auth.
// In the current version of TanStack Start, API routes are handled via
// server functions. This file exports the handler for use in the auth flow.
import { handler } from "~/lib/auth-server";

export const GET = (request: Request) => handler(request);
export const POST = (request: Request) => handler(request);
