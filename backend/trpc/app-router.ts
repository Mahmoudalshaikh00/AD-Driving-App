import { createTRPCRouter } from "./create-context";
import hiRoute, { deleteUserProcedure, createAdminUserProcedure, createStudentForInstructorProcedure } from "./routes/example/hi/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  admin: createTRPCRouter({
    deleteUser: deleteUserProcedure,
    createAdminUser: createAdminUserProcedure,
    createStudentForInstructor: createStudentForInstructorProcedure,
  }),
});

export type AppRouter = typeof appRouter;