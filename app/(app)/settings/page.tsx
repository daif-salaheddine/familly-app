import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/db";
import { getTranslations } from "next-intl/server";
import AvatarUpload from "../../../components/ui/AvatarUpload";
import LanguageSelector from "../../../components/ui/LanguageSelector";
import DisplayNameForm from "../../../components/settings/DisplayNameForm";
import PasswordChangeForm from "../../../components/settings/PasswordChangeForm";
import DigestToggle from "../../../components/settings/DigestToggle";
import DeleteAccountSection from "../../../components/settings/DeleteAccountSection";
import GoogleConnectButton from "../../../components/settings/GoogleConnectButton";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [t, currentUser, googleAccount] = await Promise.all([
    getTranslations("userSettings"),
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, language: true, avatar_url: true, digest_enabled: true },
    }),
    prisma.account.findFirst({
      where: { user_id: userId, provider: "google" },
      select: { id: true },
    }),
  ]);

  const isGoogleUser = !!googleAccount;

  const cardStyle: React.CSSProperties = {
    background: "#ffffff",
    border: "3px solid #1a1a2e",
    borderRadius: "16px",
    boxShadow: "3px 3px 0 #1a1a2e",
    padding: "20px",
  };

  const sectionTitle: React.CSSProperties = {
    fontFamily: "Bangers, cursive",
    fontSize: "16px",
    letterSpacing: "1px",
    color: "#1a1a2e",
    marginBottom: "16px",
  };

  return (
    <div className="flex flex-col gap-4">
      <h1
        style={{
          fontFamily: "Bangers, cursive",
          fontSize: "28px",
          letterSpacing: "1px",
          color: "#1a1a2e",
        }}
      >
        ⚙️ {t("title")}
      </h1>

      {/* Profile photo */}
      <div style={cardStyle}>
        <p style={sectionTitle}>🖼️ {t("avatarSection")}</p>
        <AvatarUpload
          name={currentUser?.name ?? session.user.name ?? "?"}
          initialUrl={currentUser?.avatar_url ?? null}
        />
      </div>

      {/* Display name */}
      <div style={cardStyle}>
        <p style={sectionTitle}>👤 {t("profileSection")}</p>
        <DisplayNameForm initialName={currentUser?.name ?? session.user.name ?? ""} />
      </div>

      {/* Language */}
      <div style={cardStyle}>
        <p style={sectionTitle}>🌐 {t("languageSection")}</p>
        <LanguageSelector current={currentUser?.language ?? "EN"} />
      </div>

      {/* Password — only for non-Google accounts */}
      {!isGoogleUser && (
        <div style={cardStyle}>
          <p style={sectionTitle}>🔒 {t("passwordSection")}</p>
          <PasswordChangeForm />
        </div>
      )}

      {/* Google account */}
      <div style={cardStyle}>
        <p style={sectionTitle}>🔗 {t("googleSection")}</p>
        <GoogleConnectButton connected={isGoogleUser} />
      </div>

      {/* Email digest */}
      <div style={cardStyle}>
        <p style={sectionTitle}>📧 {t("digestSection")}</p>
        <DigestToggle initialEnabled={currentUser?.digest_enabled ?? true} />
      </div>

      {/* Danger zone */}
      <div
        style={{
          ...cardStyle,
          border: "3px solid #e74c3c",
          boxShadow: "3px 3px 0 #e74c3c",
          background: "#fff5f5",
        }}
      >
        <p style={{ ...sectionTitle, color: "#c0392b" }}>⚠️ {t("dangerZone")}</p>
        <DeleteAccountSection />
      </div>
    </div>
  );
}
