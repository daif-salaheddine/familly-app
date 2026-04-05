import Link from "next/link";
import { auth, signOut } from "../../auth";
import { redirect } from "next/navigation";
import { prisma } from "../../lib/db";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const membership = await prisma.groupMember.findFirst({
    where: { user_id: session.user.id },
    select: { group_id: true, group: { select: { name: true } } },
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <span className="font-semibold text-gray-900">
          {membership?.group.name ?? "Family App"}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{session.user.name}</span>
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
          <NavLink href="/profile" label="Profile" />
          <NavLink href="/nominations" label="Nominations" />
          <NavLink href="/members" label="Family" />
        </div>
      </nav>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex-1 py-3 text-center text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
    >
      {label}
    </Link>
  );
}
