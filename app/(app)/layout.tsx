import { auth } from "../../auth";
import { redirect } from "next/navigation";
import { prisma } from "../../lib/db";
import { getActiveGroupId } from "../../lib/group";
import { getUnreadCount } from "../../lib/notifications";
import Link from "next/link";
import GroupSwitcher from "../../components/layout/GroupSwitcher";
import ProfileDropdown from "../../components/layout/ProfileDropdown";
import BottomNav from "../../components/layout/BottomNav";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [memberships, unreadCount, currentUser, tNav, tVerify] = await Promise.all([
    prisma.groupMember.findMany({
      where: { user_id: session.user.id },
      select: { group_id: true, role: true, group: { select: { id: true, name: true } } },
      orderBy: { joined_at: "asc" },
    }),
    getUnreadCount(session.user.id!),
    prisma.user.findUnique({
      where: { id: session.user.id! },
      select: { avatar_url: true, has_onboarded: true, email_verified: true, language: true },
    }),
    getTranslations("nav"),
    getTranslations("emailVerification"),
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
          {/* Notification bell */}
          <Link href="/notifications" className="relative">
            <span className="text-lg">🔔</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 rtl:-right-auto rtl:-left-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold leading-none">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          {/* Profile dropdown */}
          <ProfileDropdown
            name={session.user.name!}
            email={session.user.email!}
            avatarUrl={currentUser?.avatar_url}
            currentLanguage={currentUser?.language ?? "EN"}
            activeGroupId={activeGroupId}
          />
        </div>
      </header>

      {/* Email verification banner */}
      {!currentUser?.email_verified && (
        <div
          style={{
            background: "#fff8e1",
            borderBottom: "2px solid #f59e0b",
            padding: "10px 16px",
            textAlign: "center",
            fontFamily: "Nunito, sans-serif",
            fontSize: "13px",
            fontWeight: 700,
            color: "#92400e",
          }}
        >
          {tVerify("banner")}
        </div>
      )}

      {/* Page content — pad bottom so it clears the nav */}
      <main className="max-w-2xl mx-auto w-full px-4 py-6 pb-28 flex-1">
        {children}
      </main>

      {/* Bottom navigation — comic card style */}
      <BottomNav items={[
        { href: "/feed",        label: tNav("feed"),        emoji: "📰" },
        { href: "/profile",     label: tNav("profile"),     emoji: "👤" },
        { href: "/nominations", label: tNav("nominate"),    emoji: "📬" },
        { href: "/challenges",  label: tNav("challenges"),  emoji: "⚡" },
        { href: "/pot",         label: tNav("pot"),         emoji: "💰" },
        { href: "/leaderboard", label: tNav("ranks"),       emoji: "🏆" },
        { href: "/members",     label: tNav("members"),     emoji: "👥" },
      ]} />
    </div>
  );
}

