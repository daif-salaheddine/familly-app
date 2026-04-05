import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { prisma } from "../../../lib/db";
import { getGroupChallenges } from "../../../lib/challenges";
import MyChallengeCard from "../../../components/challenges/MyChallengeCard";
import OtherChallengeCard from "../../../components/challenges/OtherChallengeCard";

export default async function ChallengesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const membership = await prisma.groupMember.findFirst({
    where: { user_id: userId },
    select: { group_id: true },
  });
  if (!membership) redirect("/login");

  const challenges = await getGroupChallenges(membership.group_id);

  const myChallenge = challenges.find((c) => c.user_id === userId) ?? null;
  const otherChallenges = challenges.filter((c) => c.user_id !== userId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Challenges</h1>
        <p className="text-sm text-gray-500">
          Triggered after 2 consecutive missed weeks
        </p>
      </div>

      {/* My challenge */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          My challenge
        </h2>
        {myChallenge ? (
          <MyChallengeCard challenge={myChallenge} />
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
            <p className="text-sm font-medium text-gray-500">No active challenge</p>
            <p className="text-xs text-gray-400 mt-1">
              Keep your streak going and you won&apos;t get one
            </p>
          </div>
        )}
      </section>

      {/* Other members' challenges */}
      {otherChallenges.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Family challenges
          </h2>
          <div className="flex flex-col gap-3">
            {otherChallenges.map((c) => (
              <OtherChallengeCard
                key={c.id}
                challenge={c}
                currentUserId={userId}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
