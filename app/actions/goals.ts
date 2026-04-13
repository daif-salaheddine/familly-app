"use server";

import { redirect } from "next/navigation";
import { auth } from "../../auth";
import { getActiveGroupId } from "../../lib/group";
import { createGoal, createGoalSchema } from "../../lib/goals";

export async function createGoalAction(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const frequency = formData.get("frequency") as string;
  const rawCount = formData.get("frequency_count");
  const frequency_count =
    frequency === "times_per_week" ? Number(rawCount) : 1;

  const parsed = createGoalSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    slot: formData.get("slot"),
    frequency,
    frequency_count,
    penalty_amount: Number(formData.get("penalty_amount")),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const groupId = await getActiveGroupId(session.user.id);
    await createGoal(session.user.id, groupId, parsed.data);
  } catch (res) {
    if (res instanceof Response) {
      const body = await res.json();
      return { error: body.error ?? "Failed to create goal" };
    }
    return { error: "Failed to create goal" };
  }

  redirect("/profile");
}
