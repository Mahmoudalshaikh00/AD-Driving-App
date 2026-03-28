import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

// Enable CORS for all routes
app.use("*", cors());

// Add logging middleware
app.use("*", async (c, next) => {
  console.log(`🚀 ${c.req.method} ${c.req.url}`);
  const headers = c.req.header();
  console.log('📋 Headers:', headers);
  
  const start = Date.now();
  await next();
  const end = Date.now();
  
  console.log(`✅ ${c.req.method} ${c.req.url} - ${c.res.status} (${end - start}ms)`);
});

// Mount tRPC exactly where the Vercel function will receive it: /api/trpc/*
app.use(
  "/api/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
    onError: ({ error, path }) => {
      console.error(`🚨 tRPC Error on ${path}:`, error);
    },
  })
);

// Health check
app.get("/api", (c) => {
  return c.json({ 
    status: "ok", 
    message: "API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// Test endpoint for debugging
app.get("/api/test", (c) => {
  return c.json({
    status: "ok",
    message: "Backend is running",
    timestamp: new Date().toISOString(),
    endpoints: ["/api", "/api/trpc"],
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.EXPO_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }
  });
});

// Catch-all for debugging
app.all("*", (c) => {
  console.log(`❓ Unhandled route: ${c.req.method} ${c.req.url}`);
  return c.json({ 
    error: "Route not found", 
    method: c.req.method, 
    path: c.req.url,
    availableRoutes: ["/api", "/api/test", "/api/trpc/*"]
  }, 404);
});

export default app;