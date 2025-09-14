import { createTRPCRouter } from "./create-context";
import hiRoute, { deleteUserProcedure, createAdminUserProcedure } from "./routes/example/hi/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  admin: createTRPCRouter({
    deleteUser: deleteUserProcedure,
    createAdminUser: createAdminUserProcedure,
  }),
});

export type AppRouter = typeof appRouter;