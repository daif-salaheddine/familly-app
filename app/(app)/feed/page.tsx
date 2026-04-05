import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { prisma } from "../../../lib/db";
import { getGroupFeed } from "../../../lib/feed";
import FeedItem from "../../../components/feed/FeedItem";

export default async function FeedPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await prisma.groupMember.findFirst({
    where: { user_id: session.user.id },
    select: { group_id: true },
  });
  if (!membership) redirect("/login");

  const items = await getGroupFeed(membership.group_id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Feed</h1>
        <p className="text-sm text-gray-500">Recent family activity</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="text-sm font-medium text-gray-500">Nothing yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Activity from your family will show up here
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <FeedItem
              key={`${item.type}-${item.data.id}`}
              item={item}
              currentUserId={session.user!.id!}
            />
          ))}
        </div>
      )}
    </div>
  );
}
