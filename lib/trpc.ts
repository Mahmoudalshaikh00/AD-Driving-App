import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import Constants from "expo-constants";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const fromEnv = process.env.EXPO_PUBLIC_RORK_API_BASE_URL ?? Constants.expoConfig?.extra?.EXPO_PUBLIC_RORK_API_BASE_URL ?? "";
  if (fromEnv) {
    const normalized = fromEnv.startsWith("http://") || fromEnv.startsWith("https://") ? fromEnv : `https://${fromEnv}`;
    return normalized.replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/$/, "");
  }
  throw new Error("No API base URL configured. Set EXPO_PUBLIC_RORK_API_BASE_URL to your API origin (e.g. https://your-domain.com)");
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
    }),
  ],
});