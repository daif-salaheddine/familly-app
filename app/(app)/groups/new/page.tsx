import { getTranslations } from "next-intl/server";
import CreateGroupForm from "../../../../components/groups/CreateGroupForm";

export const metadata = { title: "Create group — Family Quest" };

export default async function NewGroupPage() {
  const t = await getTranslations("groups");

  return (
    <div className="flex flex-col gap-6 max-w-sm mx-auto">
      <div>
        <h1
          style={{
            fontFamily: "Bangers, cursive",
            fontSize: "28px",
            letterSpacing: "1px",
            color: "#1a1a2e",
          }}
        >
          {t("newTitle")}
        </h1>
        <p
          style={{
            fontFamily: "Nunito, sans-serif",
            fontSize: "14px",
            color: "#888",
            marginTop: "4px",
          }}
        >
          {t("newSubtitle")}
        </p>
      </div>

      <div
        style={{
          background: "#ffffff",
          border: "3px solid #1a1a2e",
          borderRadius: "16px",
          boxShadow: "3px 3px 0 #1a1a2e",
          padding: "24px",
        }}
      >
        <CreateGroupForm />
      </div>
    </div>
  );
}
