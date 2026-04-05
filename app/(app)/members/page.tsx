import Link from "next/link";
import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/db";

export default async function MembersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const currentUserId = session.user.id;

  const membership = await prisma.groupMember.findFirst({
    where: { user_id: session.user.id },
    select: { group_id: true },
  });
  if (!membership) redirect("/login");

  const members = await prisma.groupMember.findMany({
    where: { group_id: membership.group_id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { joined_at: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Family</h1>
        <p className="text-sm text-gray-500">{members.length} members</p>
      </div>

      <div className="flex flex-col gap-2">
        {members.map(({ user, role }) => (
          <Link
            key={user.id}
            href={`/members/${user.id}`}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 hover:border-indigo-300 transition-colors"
          >
            <div className="h-10 w-10 shrink-0 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
              {user.name[0]}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {user.name}
                {user.id === currentUserId && (
                  <span className="ml-2 text-xs text-gray-400">(you)</span>
                )}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            {role === "admin" && (
              <span className="ml-auto shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-600">
                admin
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
