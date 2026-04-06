import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/db";
import { getNominationsForUser } from "../../../lib/nominations";
import NominationCard from "../../../components/nominations/NominationCard";
import { getTranslations } from "next-intl/server";

export default async function NominationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [membership, t] = await Promise.all([
    prisma.groupMember.findFirst({
      where: { user_id: userId },
      select: { group_id: true },
    }),
    getTranslations("nominations"),
  ]);
  if (!membership) redirect("/login");

  const nominations = await getNominationsForUser(userId, membership.group_id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-sm text-gray-500">{t("subtitle")}</p>
      </div>

      {nominations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">{t("empty")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {nominations.map((n) => (
            <NominationCard key={n.id} nomination={n} />
          ))}
        </div>
      )}
    </div>
  );
}
