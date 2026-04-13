"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { playAcceptNomination, playLoginSuccess, playClick } from "../../lib/sounds";
import AvatarUpload from "../ui/AvatarUpload";

// ---------------------------------------------------------------------------
// Inline translations — the language can change in step 1 before next-intl
// locale takes effect, so we manage it ourselves.
// ---------------------------------------------------------------------------

type Lang = "EN" | "FR" | "AR";

const COPY: Record<
  Lang,
  {
    dir: "ltr" | "rtl";
    // Step 1
    welcomeTitle: string;
    welcomeSub: string;
    step1Title: string;
    step1Sub: string;
    // Step 2
    step2Title: string;
    step2Sub: string;
    // Step 2b
    step2bTitle: string;
    step2bSub: string;
    newPassword: string;
    confirmPassword: string;
    passwordMismatch: string;
    passwordTooShort: string;
    saving: string;
    continue: string;
    // Step 3 slides
    slides: { emoji: string; title: string; body: string }[];
    // Step 3 nav
    next: string;
    back: string;
    setFirstGoal: string;
    skipForNow: string;
    slideOf: (current: number, total: number) => string;
  }
> = {
  EN: {
    dir: "ltr",
    welcomeTitle: "Welcome to the family!",
    welcomeSub: "Let's get you set up in 3 quick steps.",
    step1Title: "Pick your language",
    step1Sub: "You can change this any time in your profile.",
    step2Title: "Set your password",
    step2Sub: "This is your personal password for this account.",
    step2bTitle: "Show your face!",
    step2bSub: "Add a profile photo so your family recognizes you.",
    newPassword: "New password",
    confirmPassword: "Confirm password",
    passwordMismatch: "Passwords don't match.",
    passwordTooShort: "Password must be at least 6 characters.",
    saving: "Saving…",
    continue: "Continue →",
    slides: [
      {
        emoji: "⚔️",
        title: "Your Quests",
        body: "You get 2 goal slots. One you choose yourself. The other is nominated by your family — you pick which suggestion to accept.",
      },
      {
        emoji: "💰",
        title: "The Family Pot",
        body: "Miss a goal for the week? Money goes into the pot. Hit all your goals and vote on how the family spends it together.",
      },
      {
        emoji: "⚡",
        title: "Challenges",
        body: "Miss the same goal twice in a row? Your family dares you to do something real. Complete it to reset your streak.",
      },
      {
        emoji: "📬",
        title: "Nominations",
        body: "Any family member can nominate a goal for your second slot. You freely choose which one to accept — no pressure, your call.",
      },
    ],
    next: "Next →",
    back: "← Back",
    setFirstGoal: "Set my first goal →",
    skipForNow: "Skip for now",
    slideOf: (c, t) => `${c} / ${t}`,
  },
  FR: {
    dir: "ltr",
    welcomeTitle: "Bienvenue dans la famille !",
    welcomeSub: "Configurons ton compte en 3 étapes rapides.",
    step1Title: "Choisis ta langue",
    step1Sub: "Tu peux la changer à tout moment dans ton profil.",
    step2Title: "Définis ton mot de passe",
    step2Sub: "C'est ton mot de passe personnel pour ce compte.",
    step2bTitle: "Montre ton visage !",
    step2bSub: "Ajoute une photo de profil pour que ta famille te reconnaisse.",
    newPassword: "Nouveau mot de passe",
    confirmPassword: "Confirmer le mot de passe",
    passwordMismatch: "Les mots de passe ne correspondent pas.",
    passwordTooShort: "Le mot de passe doit comporter au moins 6 caractères.",
    saving: "Enregistrement…",
    continue: "Continuer →",
    slides: [
      {
        emoji: "⚔️",
        title: "Tes Quêtes",
        body: "Tu as 2 emplacements d'objectifs. Un que tu choisis toi-même. L'autre est proposé par ta famille — tu choisis librement lequel accepter.",
      },
      {
        emoji: "💰",
        title: "La Cagnotte Familiale",
        body: "Tu rates un objectif dans la semaine ? L'argent va dans la cagnotte. Atteins tous tes objectifs et votez ensemble comment la dépenser.",
      },
      {
        emoji: "⚡",
        title: "Défis",
        body: "Tu rates le même objectif deux fois de suite ? Ta famille te lance un défi réel. Accomplis-le pour réinitialiser ta série.",
      },
      {
        emoji: "📬",
        title: "Nominations",
        body: "N'importe quel membre de la famille peut nommer un objectif pour ton deuxième emplacement. Tu choisis librement lequel accepter.",
      },
    ],
    next: "Suivant →",
    back: "← Retour",
    setFirstGoal: "Définir mon premier objectif →",
    skipForNow: "Passer pour l'instant",
    slideOf: (c, t) => `${c} / ${t}`,
  },
  AR: {
    dir: "rtl",
    welcomeTitle: "أهلاً بك في العائلة!",
    welcomeSub: "لنُعِدَّ حسابك في 3 خطوات سريعة.",
    step1Title: "اختر لغتك",
    step1Sub: "يمكنك تغييرها في أي وقت من ملفك الشخصي.",
    step2Title: "اضبط كلمة مرورك",
    step2Sub: "هذه كلمة مرورك الشخصية لهذا الحساب.",
    step2bTitle: "أرِنا وجهك!",
    step2bSub: "أضف صورة ملفك الشخصي حتى تتعرف عليك عائلتك.",
    newPassword: "كلمة مرور جديدة",
    confirmPassword: "تأكيد كلمة المرور",
    passwordMismatch: "كلمتا المرور غير متطابقتين.",
    passwordTooShort: "يجب أن تكون كلمة المرور 6 أحرف على الأقل.",
    saving: "جارٍ الحفظ…",
    continue: "متابعة →",
    slides: [
      {
        emoji: "⚔️",
        title: "مهامك",
        body: "لديك خانتان للأهداف. واحدة تختارها بنفسك. والأخرى تُرشِّحها عائلتك — أنت تختار أيّها تقبل.",
      },
      {
        emoji: "💰",
        title: "صندوق العائلة",
        body: "فاتك هدف هذا الأسبوع؟ تذهب الغرامة إلى الصندوق. حقِّق أهدافك كلها وصوِّتوا معاً على كيفية الإنفاق.",
      },
      {
        emoji: "⚡",
        title: "التحديات",
        body: "فاتك الهدف ذاته مرتين متتاليتين؟ عائلتك تُرسِل لك تحدياً حقيقياً. أتمِمه لإعادة تعيين سلسلتك.",
      },
      {
        emoji: "📬",
        title: "الترشيحات",
        body: "يمكن لأي فرد من العائلة ترشيح هدف لخانتك الثانية. أنت تختار بحرية أيّها تقبل — القرار قرارك.",
      },
    ],
    next: "التالي →",
    back: "← رجوع",
    setFirstGoal: "ضع هدفي الأول →",
    skipForNow: "تخطَّ الآن",
    slideOf: (c, t) => `${c} / ${t}`,
  },
};

const LANG_OPTIONS: { code: Lang; flag: string; label: string }[] = [
  { code: "EN", flag: "🇬🇧", label: "English" },
  { code: "FR", flag: "🇫🇷", label: "Français" },
  { code: "AR", flag: "🇸🇦", label: "العربية" },
];

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------

export default function OnboardingFlow({ userName, isOAuthUser }: { userName: string; isOAuthUser: boolean }) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [lang, setLang] = useState<Lang>("EN");
  // hasGroup is set after the password step (credentials) or in WalkthroughStep (OAuth)
  const [hasGroup, setHasGroup] = useState<boolean | null>(null);

  const copy = COPY[lang];

  // OAuth flow has 3 visual steps (skip password), credentials has 4
  const visibleSteps = isOAuthUser ? ([1, 3, 4] as const) : ([1, 2, 3, 4] as const);
  const visualStep = visibleSteps.indexOf(step as never) + 1;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      dir={copy.dir}
      style={{ background: "#FFFBF0" }}
    >
      {/* Progress dots */}
      <div className="flex gap-2 mb-8">
        {visibleSteps.map((_, i) => {
          const dotNumber = i + 1;
          return (
            <div
              key={dotNumber}
              style={{
                width: dotNumber === visualStep ? "28px" : "10px",
                height: "10px",
                borderRadius: "100px",
                border: "2px solid #1a1a2e",
                background: dotNumber <= visualStep ? "#6c31e3" : "#ffffff",
                transition: "all 0.2s",
              }}
            />
          );
        })}
      </div>

      {/* Welcome line (shown on step 1 only) */}
      {step === 1 && (
        <div className="text-center mb-6">
          <p
            style={{
              fontFamily: "Nunito, sans-serif",
              fontSize: "15px",
              fontWeight: 700,
              color: "#888",
            }}
          >
            {copy.welcomeSub.replace("3", "3")}
          </p>
          <h1
            style={{
              fontFamily: "Bangers, cursive",
              fontSize: "30px",
              letterSpacing: "1.5px",
              color: "#1a1a2e",
              marginTop: "4px",
            }}
          >
            {userName ? `${copy.welcomeTitle.split("!")[0]}, ${userName}!` : copy.welcomeTitle}
          </h1>
        </div>
      )}

      {/* Card wrapper */}
      <div
        className="w-full max-w-sm"
        style={{
          background: "#ffffff",
          border: "3px solid #1a1a2e",
          borderRadius: "20px",
          boxShadow: "4px 4px 0 #1a1a2e",
          padding: "28px",
        }}
      >
        {step === 1 && (
          <LanguageStep
            lang={lang}
            onSelect={(l) => {
              playClick();
              setLang(l);
              // Set locale cookie so the rest of the app uses the right language
              document.cookie = `LOCALE=${l.toLowerCase()}; path=/; max-age=${365 * 24 * 3600}; samesite=lax`;
            }}
            onNext={() => { playClick(); setStep(isOAuthUser ? 3 : 2); }}
            copy={copy}
          />
        )}
        {step === 2 && (
          <PasswordStep
            lang={lang}
            onBack={() => { playClick(); setStep(1); }}
            onSuccess={(hg) => { playAcceptNomination(); setHasGroup(hg); setStep(3); }}
            copy={copy}
          />
        )}
        {step === 3 && (
          <AvatarStep
            userName={userName}
            onAdvance={() => { playClick(); setStep(4); }}
            copy={copy}
          />
        )}
        {step === 4 && (
          <WalkthroughStep
            copy={copy}
            lang={lang}
            isOAuthUser={isOAuthUser}
            hasGroup={hasGroup}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Language picker
// ---------------------------------------------------------------------------

function LanguageStep({
  lang,
  onSelect,
  onNext,
  copy,
}: {
  lang: Lang;
  onSelect: (l: Lang) => void;
  onNext: () => void;
  copy: (typeof COPY)["EN"];
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2
          style={{
            fontFamily: "Bangers, cursive",
            fontSize: "22px",
            letterSpacing: "1px",
            color: "#1a1a2e",
          }}
        >
          {copy.step1Title}
        </h2>
        <p
          style={{
            fontFamily: "Nunito, sans-serif",
            fontSize: "13px",
            fontWeight: 600,
            color: "#888",
            marginTop: "4px",
          }}
        >
          {copy.step1Sub}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {LANG_OPTIONS.map(({ code, flag, label }) => (
          <button
            key={code}
            onClick={() => onSelect(code)}
            style={{
              fontFamily: "Nunito, sans-serif",
              fontWeight: 800,
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "14px 18px",
              borderRadius: "14px",
              border: "3px solid #1a1a2e",
              boxShadow: lang === code ? "3px 3px 0 #1a1a2e" : "none",
              background: lang === code ? "#6c31e3" : "#ffffff",
              color: lang === code ? "#ffffff" : "#1a1a2e",
              cursor: "pointer",
              transition: "all 0.12s",
              width: "100%",
              textAlign: "left",
            }}
          >
            <span style={{ fontSize: "24px" }}>{flag}</span>
            <span>{label}</span>
            {lang === code && (
              <span style={{ marginInlineStart: "auto", fontSize: "18px" }}>✓</span>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={onNext}
        style={{
          fontFamily: "Nunito, sans-serif",
          fontWeight: 800,
          fontSize: "15px",
          background: "#6c31e3",
          color: "#ffffff",
          border: "2px solid #1a1a2e",
          borderRadius: "100px",
          boxShadow: "2px 2px 0 #1a1a2e",
          padding: "12px 24px",
          cursor: "pointer",
          marginTop: "4px",
        }}
      >
        {copy.continue}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Set password
// ---------------------------------------------------------------------------

function PasswordStep({
  lang,
  onBack,
  onSuccess,
  copy,
}: {
  lang: Lang;
  onBack: () => void;
  onSuccess: (hasGroup: boolean) => void;
  copy: (typeof COPY)["EN"];
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError(copy.passwordTooShort);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(copy.passwordMismatch);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user/onboard", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: lang, newPassword }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error ?? "Something went wrong.");
      } else {
        onSuccess(json.data?.hasGroup ?? false);
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    fontFamily: "Nunito, sans-serif",
    fontSize: "14px",
    fontWeight: 600,
    color: "#1a1a2e",
    background: "#ffffff",
    border: "2px solid #1a1a2e",
    borderRadius: "10px",
    padding: "10px 14px",
    outline: "none",
    width: "100%",
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2
          style={{
            fontFamily: "Bangers, cursive",
            fontSize: "22px",
            letterSpacing: "1px",
            color: "#1a1a2e",
          }}
        >
          {copy.step2Title}
        </h2>
        <p
          style={{
            fontFamily: "Nunito, sans-serif",
            fontSize: "13px",
            fontWeight: 600,
            color: "#888",
            marginTop: "4px",
          }}
        >
          {copy.step2Sub}
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label
          style={{
            fontFamily: "Nunito, sans-serif",
            fontSize: "13px",
            fontWeight: 700,
            color: "#1a1a2e",
          }}
        >
          {copy.newPassword}
        </label>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          style={inputStyle}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          style={{
            fontFamily: "Nunito, sans-serif",
            fontSize: "13px",
            fontWeight: 700,
            color: "#1a1a2e",
          }}
        >
          {copy.confirmPassword}
        </label>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={inputStyle}
        />
      </div>

      {error && (
        <p
          style={{
            fontFamily: "Nunito, sans-serif",
            fontSize: "13px",
            fontWeight: 700,
            color: "#e74c3c",
          }}
        >
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          style={{
            fontFamily: "Nunito, sans-serif",
            fontWeight: 800,
            fontSize: "14px",
            background: "#ffffff",
            color: "#1a1a2e",
            border: "2px solid #1a1a2e",
            borderRadius: "100px",
            boxShadow: "2px 2px 0 #1a1a2e",
            padding: "10px 18px",
            cursor: "pointer",
          }}
        >
          {copy.back}
        </button>
        <button
          type="submit"
          disabled={loading}
          style={{
            fontFamily: "Nunito, sans-serif",
            fontWeight: 800,
            fontSize: "15px",
            background: loading ? "#9b7fd4" : "#6c31e3",
            color: "#ffffff",
            border: "2px solid #1a1a2e",
            borderRadius: "100px",
            boxShadow: "2px 2px 0 #1a1a2e",
            padding: "10px 24px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            flex: 1,
          }}
        >
          {loading ? copy.saving : copy.continue}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Step 2b — Avatar upload
// ---------------------------------------------------------------------------

function AvatarStep({
  userName,
  onAdvance,
  copy,
}: {
  userName: string;
  onAdvance: () => void;
  copy: (typeof COPY)["EN"];
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2
          style={{
            fontFamily: "Bangers, cursive",
            fontSize: "22px",
            letterSpacing: "1px",
            color: "#1a1a2e",
          }}
        >
          {copy.step2bTitle}
        </h2>
        <p
          style={{
            fontFamily: "Nunito, sans-serif",
            fontSize: "13px",
            fontWeight: 600,
            color: "#888",
            marginTop: "4px",
          }}
        >
          {copy.step2bSub}
        </p>
      </div>

      <div className="flex justify-center py-4">
        <AvatarUpload name={userName} initialUrl={null} onUpload={onAdvance} />
      </div>

      <button
        type="button"
        onClick={onAdvance}
        style={{
          fontFamily: "Nunito, sans-serif",
          fontWeight: 700,
          fontSize: "14px",
          background: "transparent",
          color: "#888",
          border: "none",
          padding: "8px 20px",
          cursor: "pointer",
          alignSelf: "center",
        }}
      >
        {copy.skipForNow}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Walkthrough slides
// ---------------------------------------------------------------------------

const SLIDE_COLORS = ["#E8F4FF", "#FFF8E0", "#FFE8F5", "#E8FFE8"];
const SLIDE_BORDER_COLORS = ["#6c31e3", "#f1c40f", "#e74c3c", "#2ecc71"];

function WalkthroughStep({
  copy,
  lang,
  isOAuthUser,
  hasGroup,
}: {
  copy: (typeof COPY)["EN"];
  lang: Lang;
  isOAuthUser: boolean;
  hasGroup: boolean | null;
}) {
  const router = useRouter();
  const [slide, setSlide] = useState(0);
  const [completing, setCompleting] = useState(false);
  const isLast = slide === copy.slides.length - 1;
  const current = copy.slides[slide];

  function handleNext() {
    playClick();
    if (!isLast) setSlide((s) => s + 1);
  }
  function handleBack() {
    playClick();
    setSlide((s) => Math.max(0, s - 1));
  }

  async function finish(redirectTo: "goal" | "skip") {
    setCompleting(true);
    let finalHasGroup = hasGroup;

    // OAuth users haven't called the onboard API yet — do it now
    if (isOAuthUser) {
      try {
        const res = await fetch("/api/user/onboard", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language: lang }),
        });
        const json = await res.json();
        finalHasGroup = json.data?.hasGroup ?? false;
      } catch {
        finalHasGroup = false;
      }
    }

    if (!finalHasGroup) {
      router.push("/groups/new");
    } else if (redirectTo === "goal") {
      router.push("/profile/goals/new");
    } else {
      router.push("/profile");
    }
  }

  function handleSetGoal() {
    playLoginSuccess();
    finish("goal");
  }
  function handleSkip() {
    playClick();
    finish("skip");
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Slide card */}
      <div
        style={{
          background: SLIDE_COLORS[slide],
          border: `3px solid ${SLIDE_BORDER_COLORS[slide]}`,
          borderRadius: "16px",
          boxShadow: `3px 3px 0 ${SLIDE_BORDER_COLORS[slide]}`,
          padding: "24px 20px",
          minHeight: "180px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: "12px",
          transition: "all 0.15s",
        }}
      >
        <span style={{ fontSize: "48px", lineHeight: 1 }}>{current.emoji}</span>
        <h3
          style={{
            fontFamily: "Bangers, cursive",
            fontSize: "26px",
            letterSpacing: "1.5px",
            color: "#1a1a2e",
          }}
        >
          {current.title}
        </h3>
        <p
          style={{
            fontFamily: "Nunito, sans-serif",
            fontSize: "14px",
            fontWeight: 600,
            color: "#444",
            lineHeight: 1.5,
          }}
        >
          {current.body}
        </p>
      </div>

      {/* Slide dots */}
      <div className="flex justify-center gap-2">
        {copy.slides.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === slide ? "20px" : "8px",
              height: "8px",
              borderRadius: "100px",
              border: "2px solid #1a1a2e",
              background: i === slide ? "#6c31e3" : "#ffffff",
              transition: "all 0.2s",
              cursor: "pointer",
            }}
            onClick={() => { playClick(); setSlide(i); }}
          />
        ))}
      </div>

      {/* CTA on last slide */}
      {isLast ? (
        <div className="flex flex-col gap-3 mt-2">
          <button
            onClick={handleSetGoal}
            disabled={completing}
            style={{
              fontFamily: "Nunito, sans-serif",
              fontWeight: 800,
              fontSize: "15px",
              background: completing ? "#9be0b3" : "#2ecc71",
              color: "#1a1a2e",
              border: "2px solid #1a1a2e",
              borderRadius: "100px",
              boxShadow: completing ? "none" : "2px 2px 0 #1a1a2e",
              padding: "12px 20px",
              cursor: completing ? "not-allowed" : "pointer",
              opacity: completing ? 0.7 : 1,
            }}
          >
            {completing ? copy.saving : copy.setFirstGoal}
          </button>
          <button
            onClick={handleSkip}
            disabled={completing}
            style={{
              fontFamily: "Nunito, sans-serif",
              fontWeight: 700,
              fontSize: "14px",
              background: "transparent",
              color: "#888",
              border: "none",
              borderRadius: "100px",
              padding: "8px 20px",
              cursor: completing ? "not-allowed" : "pointer",
              opacity: completing ? 0.5 : 1,
            }}
          >
            {copy.skipForNow}
          </button>
        </div>
      ) : (
        /* Next / Back buttons */
        <div className="flex gap-3 mt-2">
          {slide > 0 && (
            <button
              onClick={handleBack}
              style={{
                fontFamily: "Nunito, sans-serif",
                fontWeight: 800,
                fontSize: "14px",
                background: "#ffffff",
                color: "#1a1a2e",
                border: "2px solid #1a1a2e",
                borderRadius: "100px",
                boxShadow: "2px 2px 0 #1a1a2e",
                padding: "10px 18px",
                cursor: "pointer",
              }}
            >
              {copy.back}
            </button>
          )}
          <button
            onClick={handleNext}
            style={{
              fontFamily: "Nunito, sans-serif",
              fontWeight: 800,
              fontSize: "15px",
              background: "#6c31e3",
              color: "#ffffff",
              border: "2px solid #1a1a2e",
              borderRadius: "100px",
              boxShadow: "2px 2px 0 #1a1a2e",
              padding: "10px 24px",
              cursor: "pointer",
              flex: 1,
            }}
          >
            {copy.next}
          </button>
        </div>
      )}
    </div>
  );
}
