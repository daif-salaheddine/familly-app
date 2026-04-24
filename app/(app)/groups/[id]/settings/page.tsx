import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "../../../../../auth";
import { prisma } from "../../../../../lib/db";
import { getTranslations } from "next-intl/server";
import GroupSettingsPanel from "../../../../../components/groups/GroupSettingsPanel";

export const metadata = { title: "Group settings — Family Quest" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function GroupSettingsPage({ params }: Props) {
  const { id: groupId } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Fetch group with all members including joined_at
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      name: true,
      invite_code: true,
      last_penalty_run_at: true,
      members: {
        include: {
          user: { select: { id: true, name: true, avatar_url: true } },
        },
        orderBy: { joined_at: "asc" },
      },
    },
  });

  if (!group) redirect("/profile");

  // Check caller is a member
  const callerMembership = group.members.find(
    (m) => m.user_id === session.user.id
  );
  if (!callerMembership) redirect("/profile");

  const isAdmin = callerMembership.role === "admin";

  // Derive the origin for building the invite URL server-side
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  const origin = `${proto}://${host}`;

  const t = await getTranslations("settings");

  const members = group.members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    avatar_url: m.user.avatar_url,
    role: m.role as "admin" | "member",
    joined_at: m.joined_at.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto">
      <h1
        style={{
          fontFamily: "Bangers, cursive",
          fontSize: "28px",
          letterSpacing: "1px",
          color: "#1a1a2e",
        }}
      >
        {t("title")}
      </h1>

      <GroupSettingsPanel
        groupId={group.id}
        initialName={group.name}
        initialInviteCode={group.invite_code}
        lastPenaltyRunAt={group.last_penalty_run_at?.toISOString() ?? null}
        members={members}
        currentUserId={session.user.id!}
        origin={origin}
        isAdmin={isAdmin}
      />
    </div>
  );
}
