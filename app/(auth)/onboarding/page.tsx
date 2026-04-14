import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/db";
import OnboardingFlow from "../../../components/onboarding/OnboardingFlow";

export const metadata = {
  title: "Welcome — Family App",
};

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // If already onboarded, skip straight to the app
  const user = await prisma.user.findUnique({
    where: { id: session.user.id! },
    select: { has_onboarded: true, name: true, password_hash: true },
  });
  if (user?.has_onboarded) redirect("/profile");

  // Users who already have a password (email-registered) skip the password step.
  // OAuth users (no password_hash) should see it to optionally add a backup password.
  const skipPasswordStep = !!user?.password_hash;

  return <OnboardingFlow userName={user?.name ?? ""} skipPasswordStep={skipPasswordStep} />;
}
