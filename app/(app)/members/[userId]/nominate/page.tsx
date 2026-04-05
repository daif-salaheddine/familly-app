import { notFound } from "next/navigation";
import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";
import { prisma } from "../../../../../lib/db";
import NominateForm from "../../../../../components/nominations/NominateForm";

export default async function NominatePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { userId } = await params;

  if (userId === session.user.id) redirect(`/members/${userId}`);

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true },
  });
  if (!targetUser) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Nominate a goal</h1>
        <p className="text-sm text-gray-500">For {targetUser.name}</p>
      </div>
      <NominateForm toUserId={userId} toUserName={targetUser.name} />
    </div>
  );
}
