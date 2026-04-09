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
    select: { has_onboarded: true, name: true },
  });
  if (user?.has_onboarded) redirect("/profile");

  return <OnboardingFlow userName={user?.name ?? ""} />;
}
