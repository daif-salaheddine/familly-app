import type { Goal, User } from "../app/generated/prisma/client";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

export type GoalWithNominator = Goal & {
  nominator: Pick<User, "id" | "name"> | null;
};
