import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import Constants from "expo-constants";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const fromEnv = process.env.EXPO_PUBLIC_RORK_API_BASE_URL ?? Constants.expoConfig?.extra?.EXPO_PUBLIC_RORK_API_BASE_URL ?? "https://ad-driving-app.vercel.app";
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
      fetch: async (url, options) => {
        try {
          console.log('🌐 tRPC request to:', url);
          const response = await fetch(url, options);
          
          if (!response.ok) {
            console.error('❌ tRPC HTTP error:', response.status, response.statusText);
            const text = await response.text();
            console.error('❌ Response body:', text.substring(0, 200));
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const contentType = response.headers.get('content-type');
          if (!contentType?.includes('application/json')) {
            const text = await response.text();
            console.error('❌ Non-JSON response:', text.substring(0, 200));
            throw new Error('Server returned non-JSON response');
          }
          
          return response;
        } catch (error: any) {
          console.error('🚨 tRPC fetch error:', error.message);
          throw error;
        }
      },
    }),
  ],
});