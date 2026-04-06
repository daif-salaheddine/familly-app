import Link from "next/link";
import { auth, signOut } from "../../auth";
import { redirect } from "next/navigation";
import { prisma } from "../../lib/db";
import { getUnreadCount } from "../../lib/notifications";
import Avatar from "../../components/ui/Avatar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [membership, unreadCount, currentUser] = await Promise.all([
    prisma.groupMember.findFirst({
      where: { user_id: session.user.id },
      select: { group_id: true, group: { select: { name: true } } },
    }),
    getUnreadCount(session.user.id!),
    prisma.user.findUnique({
      where: { id: session.user.id! },
      select: { avatar_url: true },
    }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <span className="font-semibold text-gray-900">
          {membership?.group.name ?? "Family App"}
        </span>
        <div className="flex items-center gap-3">
          <Link href="/profile" className="flex items-center gap-2">
            <Avatar
              name={session.user.name!}
              url={currentUser?.avatar_url}
              size="sm"
            />
            <span className="text-sm text-gray-500">{session.user.name}</span>
          </Link>

          {/* Notification bell */}
          <Link href="/notifications" className="relative">
            <span className="text-lg">🔔</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold leading-none">
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
              className="text-sm text-gray-400 hover:text-red-500 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      {/* Page content — pad bottom so it clears the nav */}
      <main className="max-w-2xl mx-auto w-full px-4 py-6 pb-24 flex-1">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
        <div className="max-w-2xl mx-auto flex">
          <NavLink href="/feed" label="Feed" />
          <NavLink href="/profile" label="Profile" />
          <NavLink href="/nominations" label="Nominate" />
          <NavLink href="/challenges" label="Challenges" />
          <NavLink href="/pot" label="Pot" />
          <NavLink href="/leaderboard" label="Ranks" />
          <NavLink href="/members" label="Members" />
        </div>
      </nav>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex-1 py-3 text-center text-xs font-medium text-gray-500 hover:text-indigo-600 transition-colors"
    >
      {label}
    </Link>
  );
}
