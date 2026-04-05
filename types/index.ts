import type { Goal, Nomination, User } from "../app/generated/prisma/client";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

export type GoalWithNominator = Goal & {
  nominator: Pick<User, "id" | "name"> | null;
};

export type NominationWithUsers = Nomination & {
  fromUser: Pick<User, "id" | "name">;
  toUser: Pick<User, "id" | "name">;
};

export type { SuggestionWithUser, ChallengeWithDetails } from "../lib/challenges";
