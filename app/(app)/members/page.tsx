import Link from "next/link";
import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/db";
import Avatar from "../../../components/ui/Avatar";
import { getTranslations } from "next-intl/server";

export default async function MembersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const currentUserId = session.user.id;

  const [membership, t] = await Promise.all([
    prisma.groupMember.findFirst({
      where: { user_id: session.user.id },
      select: { group_id: true },
    }),
    getTranslations("members"),
  ]);
  if (!membership) redirect("/login");

  const members = await prisma.groupMember.findMany({
    where: { group_id: membership.group_id },
    include: {
      user: { select: { id: true, name: true, email: true, avatar_url: true } },
    },
    orderBy: { joined_at: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-sm text-gray-500">
          {members.length} {t("subtitle").toLowerCase()}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {members.map(({ user, role }) => (
          <Link
            key={user.id}
            href={`/members/${user.id}`}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 hover:border-indigo-300 transition-colors"
          >
            <Avatar name={user.name} url={user.avatar_url} size="md" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900 truncate">
                {user.name}
                {user.id === currentUserId && (
                  <span className="ms-2 text-xs text-gray-400">
                    ({t("subtitle").includes("groupe") ? "vous" : "you"})
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            {role === "admin" && (
              <span className="ms-auto shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-600">
                admin
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
