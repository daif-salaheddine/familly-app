import { getTranslations } from "next-intl/server";
import { auth } from "../../../auth";
import { prisma } from "../../../lib/db";
import VerifyEmailCard from "../../../components/auth/VerifyEmailCard";

export default async function VerifyEmailPage() {
  const t = await getTranslations("emailVerification");

  const session = await auth();
  let userEmail: string | null = null;
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });
    userEmail = user?.email ?? null;
  }

  const labels = {
    sentTitle: t("sentTitle"),
    sentBody: t("sentBody"),
    backToLogin: t("backToLogin"),
    resend: t("resend"),
    resent: t("resent"),
    changeEmail: t("changeEmail"),
    newEmailPlaceholder: t("newEmailPlaceholder"),
    updateEmail: t("updateEmail"),
    back: t("back"),
    saving: t("saving"),
    errorInUse: t("errorInUse"),
    errorGeneric: t("errorGeneric"),
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#FFFBF0" }}
    >
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1
            style={{
              fontFamily: "Bangers, cursive",
              fontSize: "30px",
              letterSpacing: "2px",
              color: "#1a1a2e",
            }}
          >
            {t("title")}
          </h1>
        </div>
        <VerifyEmailCard initialEmail={userEmail} labels={labels} />
      </div>
    </div>
  );
}
