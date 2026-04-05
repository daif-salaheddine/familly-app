import { notFound, redirect } from "next/navigation";
import { auth } from "../../../../../../auth";
import { prisma } from "../../../../../../lib/db";
import CheckinForm from "../../../../../../components/goals/CheckinForm";

export default async function CheckinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const goal = await prisma.goal.findUnique({
    where: { id },
    select: { id: true, title: true, user_id: true, status: true },
  });

  if (!goal) notFound();
  if (goal.user_id !== session.user.id) notFound();
  if (goal.status !== "active") redirect(`/profile/goals/${id}`);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Upload proof</h1>
        <p className="text-sm text-gray-500 mt-0.5">{goal.title}</p>
      </div>
      <CheckinForm goalId={id} />
    </div>
  );
}
