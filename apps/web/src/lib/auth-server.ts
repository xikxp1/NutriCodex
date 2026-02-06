import { convexBetterAuthReactStart } from "@convex-dev/better-auth/react-start";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }
  return value;
}

export const { handler, getToken, fetchAuthQuery, fetchAuthMutation, fetchAuthAction } =
  convexBetterAuthReactStart({
    convexUrl: getEnv("VITE_CONVEX_URL"),
    convexSiteUrl: getEnv("VITE_CONVEX_SITE_URL"),
  });
