import Link from "next/link";
import { auth, signOut } from "../../auth";
import { redirect } from "next/navigation";
import { prisma } from "../../lib/db";
import { getActiveGroupId } from "../../lib/group";
import { getUnreadCount } from "../../lib/notifications";
import Avatar from "../../components/ui/Avatar";
import GroupSwitcher from "../../components/layout/GroupSwitcher";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [memberships, unreadCount, currentUser, tNav, tCommon] = await Promise.all([
    prisma.groupMember.findMany({
      where: { user_id: session.user.id },
      select: { group_id: true, role: true, group: { select: { id: true, name: true } } },
      orderBy: { joined_at: "asc" },
    }),
    getUnreadCount(session.user.id!),
    prisma.user.findUnique({
      where: { id: session.user.id! },
      select: { avatar_url: true, has_onboarded: true },
    }),
    getTranslations("nav"),
    getTranslations("common"),
  ]);

  if (!currentUser?.has_onboarded) {
    redirect("/onboarding");
  }

  // Logged in + onboarded but not in any group → send to group creation.
  // Read the injected header (set by middleware) to avoid redirecting
  // /groups/new itself into an infinite loop.
  if (memberships.length === 0) {
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") ?? "";
    if (pathname !== "/groups/new") {
      redirect("/groups/new");
    }
  }

  // Determine which group is currently active
  const activeGroupId = memberships.length > 0
    ? await getActiveGroupId(session.user.id!)
    : null;

  const groups = memberships.map((m) => ({
    id: m.group.id,
    name: m.group.name,
    isAdmin: m.role === "admin",
  }));

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FFFBF0" }}>
      {/* Top header */}
      <header
        className="px-4 py-3 flex items-center justify-between sticky top-0 z-10"
        style={{
          background: "#ffffff",
          borderBottom: "3px solid #1a1a2e",
        }}
      >
        {/* Group name / switcher */}
        <GroupSwitcher
          groups={groups}
          activeGroupId={activeGroupId ?? ""}
        />

        <div className="flex items-center gap-3">
          <Link href="/profile" className="flex items-center gap-2">
            <Avatar
              name={session.user.name!}
              url={currentUser?.avatar_url}
              size="sm"
            />
            <span
              style={{
                fontFamily: "Nunito, sans-serif",
                fontSize: "13px",
                fontWeight: 700,
                color: "#1a1a2e",
              }}
            >
              {session.user.name}
            </span>
          </Link>

          {/* Notification bell */}
          <Link href="/notifications" className="relative">
            <span className="text-lg">🔔</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 rtl:-right-auto rtl:-left-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold leading-none">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              style={{
                fontFamily: "Nunito, sans-serif",
                fontSize: "13px",
                fontWeight: 700,
                color: "#888",
              }}
              className="hover:text-red-500 transition-colors"
            >
              {tCommon("signOut")}
            </button>
          </form>
        </div>
      </header>

      {/* Page content — pad bottom so it clears the nav */}
      <main className="max-w-2xl mx-auto w-full px-4 py-6 pb-28 flex-1">
        {children}
      </main>

      {/* Bottom navigation — comic card style */}
      <nav className="fixed bottom-3 left-3 right-3 z-10">
        <div
          className="max-w-2xl mx-auto flex"
          style={{
            background: "#ffffff",
            border: "3px solid #1a1a2e",
            borderRadius: "20px",
            boxShadow: "3px 3px 0 #1a1a2e",
          }}
        >
          <NavLink href="/feed"        label={tNav("feed")}        emoji="📰" />
          <NavLink href="/profile"     label={tNav("profile")}     emoji="👤" />
          <NavLink href="/nominations" label={tNav("nominate")}    emoji="📬" />
          <NavLink href="/challenges"  label={tNav("challenges")}  emoji="⚡" />
          <NavLink href="/pot"         label={tNav("pot")}         emoji="💰" />
          <NavLink href="/leaderboard" label={tNav("ranks")}       emoji="🏆" />
          <NavLink href="/members"     label={tNav("members")}     emoji="👥" />
        </div>
      </nav>
    </div>
  );
}

function NavLink({
  href,
  label,
  emoji,
}: {
  href: string;
  label: string;
  emoji: string;
}) {
  return (
    <Link
      href={href}
      className="flex-1 py-2 flex flex-col items-center gap-0.5 transition-colors hover:opacity-80"
      style={{
        fontFamily: "Bangers, cursive",
        fontSize: "10px",
        letterSpacing: "1px",
        color: "#888",
        textTransform: "uppercase",
      }}
    >
      <span className="text-base leading-none">{emoji}</span>
      <span>{label}</span>
    </Link>
  );
}
