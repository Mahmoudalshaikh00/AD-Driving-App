import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

app.use("*", cors());

// Mount tRPC exactly where the Vercel function will receive it: /api/trpc/*
app.use(
  "/api/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  })
);

// Health check
app.get("/api", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

// Test endpoint for debugging
app.get("/api/test", (c) => {
  return c.json({
    status: "ok",
    message: "Backend is running",
    timestamp: new Date().toISOString(),
    endpoints: ["/api", "/api/trpc"],
  });
});

export default app;