import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import Constants from "expo-constants";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  // Try multiple sources for the base URL
  const fromEnv = process.env.EXPO_PUBLIC_RORK_API_BASE_URL ?? 
                  Constants.expoConfig?.extra?.EXPO_PUBLIC_RORK_API_BASE_URL ?? 
                  "ad-driving-app.vercel.app";
  
  console.log('🔧 tRPC Base URL sources:', {
    processEnv: process.env.EXPO_PUBLIC_RORK_API_BASE_URL,
    expoConfig: Constants.expoConfig?.extra?.EXPO_PUBLIC_RORK_API_BASE_URL,
    fallback: "ad-driving-app.vercel.app",
    selected: fromEnv
  });
  
  if (fromEnv) {
    const normalized = fromEnv.startsWith("http://") || fromEnv.startsWith("https://") ? fromEnv : `https://${fromEnv}`;
    const baseUrl = normalized.replace(/\/$/, "");
    console.log('🌐 tRPC Base URL:', baseUrl);
    return baseUrl;
  }
  
  if (typeof window !== "undefined" && window.location?.origin) {
    const webUrl = window.location.origin.replace(/\/$/, "");
    console.log('🌐 tRPC Web URL:', webUrl);
    return webUrl;
  }
  
  throw new Error("No API base URL configured. Set EXPO_PUBLIC_RORK_API_BASE_URL to your API origin (e.g. https://your-domain.com)");
};

const baseUrl = getBaseUrl();
const trpcUrl = `${baseUrl}/api/trpc`;
console.log('🔗 tRPC Client URL:', trpcUrl);

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: trpcUrl,
      transformer: superjson,
      fetch: async (url, options) => {
        try {
          console.log('🌐 tRPC request:', {
            url,
            method: options?.method || 'GET',
            headers: options?.headers,
            bodyLength: options?.body ? String(options.body).length : 0
          });
          
          const response = await fetch(url, {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              ...options?.headers,
            },
          });
          
          console.log('📥 tRPC response:', {
            status: response.status,
            statusText: response.statusText,
            contentType: response.headers.get('content-type'),
            ok: response.ok
          });
          
          if (!response.ok) {
            const text = await response.text();
            console.error('❌ tRPC HTTP error:', {
              status: response.status,
              statusText: response.statusText,
              body: text.substring(0, 500)
            });
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const contentType = response.headers.get('content-type');
          if (!contentType?.includes('application/json')) {
            const text = await response.text();
            console.error('❌ Non-JSON response:', {
              contentType,
              body: text.substring(0, 500)
            });
            throw new Error('Server returned non-JSON response');
          }
          
          return response;
        } catch (error: any) {
          console.error('🚨 tRPC fetch error:', {
            message: error.message,
            name: error.name,
            stack: error.stack?.substring(0, 500)
          });
          throw error;
        }
      },
    }),
  ],
});