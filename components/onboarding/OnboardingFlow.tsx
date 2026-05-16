"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { playAcceptNomination, playLoginSuccess, playClick } from "../../lib/sounds";
import AvatarUpload from "../ui/AvatarUpload";

// ---------------------------------------------------------------------------
// Inline translations — language can change in step 1 before next-intl
// locale takes effect, so we manage it ourselves.
// ---------------------------------------------------------------------------

type Lang = "EN" | "FR" | "AR";

const COPY: Record<
  Lang,
  {
    dir: "ltr" | "rtl";
    welcomeTitle: string;
    welcomeSub: string;
    step1Title: string;
    step1Sub: string;
    step2Title: string;
    step2Sub: string;
    step2bTitle: string;
    step2bSub: string;
    newPassword: string;
    confirmPassword: string;
    passwordMismatch: string;
    passwordTooShort: string;
    saving: string;
    continue: string;
    storyScreens: { hook?: string; body: string }[];
    ruleScreens: { emoji: string; title: string; body: string }[];
    tapToContinue: string;
    letsGo: string;
    next: string;
    back: string;
    skipForNow: string;
  }
> = {
  EN: {
    dir: "ltr",
    welcomeTitle: "Welcome to the family!",
    welcomeSub: "Let's get you set up in 3 quick steps.",
    step1Title: "Pick your language",
    step1Sub: "You can change this any time in your profile.",
    step2Title: "Add a backup password",
    step2Sub: "Optional — lets you sign in without Google. Skip if you prefer.",
    step2bTitle: "Show your face!",
    step2bSub: "Add a profile photo so your family recognizes you.",
    newPassword: "New password",
    confirmPassword: "Confirm password",
    passwordMismatch: "Passwords don't match.",
    passwordTooShort: "Password must be at least 8 characters.",
    saving: "Saving…",
    continue: "Continue →",
    storyScreens: [
      { body: "You love your family. But life pulled you in different directions." },
      { body: "Different cities. Different schedules. Different worlds." },
      { body: "The calls became shorter. The 'I'll start Monday' became a habit. And somewhere along the way, you stopped growing — together." },
      { hook: "Family Quest changes that.", body: "One goal. One week. Real money on the line. And your family watching." },
      { hook: "Because nothing pushes you harder than the people who know exactly what you're capable of.", body: "Welcome to the pact. Don't let your family down." },
    ],
    ruleScreens: [
      { emoji: "⚔️", title: "Goals", body: "You get 2 goal slots. Slot 1 is yours to choose. Slot 2 comes from your family — they nominate, you decide." },
      { emoji: "📅", title: "Weekly Cycle", body: "Every week runs Monday to Sunday. Check in with proof to show you showed up." },
      { emoji: "💸", title: "Penalties", body: "Miss a week? Money goes straight to the family pot. No excuses." },
      { emoji: "⚡", title: "Consecutive Misses", body: "Miss 2 weeks in a row and your family assigns you a real-life challenge. Complete it or face another penalty." },
      { emoji: "💰", title: "The Pot", body: "Every penalty feeds the pot. When it grows big enough, the family votes together on how to spend it." },
      { emoji: "📬", title: "Nominations", body: "See someone slacking? Nominate a goal for them. One nomination per person at a time." },
      { emoji: "🚀", title: "Ready?", body: "The pact starts now. Set your first goal. Your family is watching." },
    ],
    tapToContinue: "Tap to continue",
    letsGo: "Let's go →",
    next: "Next →",
    back: "← Back",
    skipForNow: "Skip for now",
  },
  FR: {
    dir: "ltr",
    welcomeTitle: "Bienvenue dans la famille !",
    welcomeSub: "Configurons ton compte en 3 étapes rapides.",
    step1Title: "Choisis ta langue",
    step1Sub: "Tu peux la changer à tout moment dans ton profil.",
    step2Title: "Ajoute un mot de passe de secours",
    step2Sub: "Optionnel — pour te connecter sans Google. Tu peux passer.",
    step2bTitle: "Montre ton visage !",
    step2bSub: "Ajoute une photo de profil pour que ta famille te reconnaisse.",
    newPassword: "Nouveau mot de passe",
    confirmPassword: "Confirmer le mot de passe",
    passwordMismatch: "Les mots de passe ne correspondent pas.",
    passwordTooShort: "Le mot de passe doit comporter au moins 8 caractères.",
    saving: "Enregistrement…",
    continue: "Continuer →",
    storyScreens: [
      { body: "Tu aimes ta famille. Mais la vie vous a éloignés les uns des autres." },
      { body: "Villes différentes. Horaires différents. Mondes différents." },
      { body: "Les appels sont devenus plus courts. Le 'Je commence lundi' est devenu une habitude. Et quelque part en chemin, vous avez cessé de grandir — ensemble." },
      { hook: "Family Quest change ça.", body: "Un objectif. Une semaine. De l'argent en jeu. Et ta famille qui regarde." },
      { hook: "Parce que rien ne te pousse plus fort que les gens qui savent exactement ce dont tu es capable.", body: "Bienvenue dans le pacte. Ne déçois pas ta famille." },
    ],
    ruleScreens: [
      { emoji: "⚔️", title: "Objectifs", body: "Tu as 2 emplacements d'objectifs. L'emplacement 1 est le tien. L'emplacement 2 vient de ta famille — ils nomment, tu décides." },
      { emoji: "📅", title: "Cycle Hebdomadaire", body: "Chaque semaine va du lundi au dimanche. Enregistre-toi avec une preuve pour montrer que tu t'es présenté." },
      { emoji: "💸", title: "Pénalités", body: "Tu rates une semaine ? L'argent va directement dans la cagnotte familiale. Pas d'excuses." },
      { emoji: "⚡", title: "Ratages Consécutifs", body: "Tu rates 2 semaines de suite et ta famille te confie un défi réel. Accomplis-le ou fais face à une autre pénalité." },
      { emoji: "💰", title: "La Cagnotte", body: "Chaque pénalité alimente la cagnotte. Quand elle grossit assez, la famille vote ensemble sur la façon de la dépenser." },
      { emoji: "📬", title: "Nominations", body: "Tu vois quelqu'un se relâcher ? Nommine-lui un objectif. Une nomination par personne à la fois." },
      { emoji: "🚀", title: "Prêt ?", body: "Le pacte commence maintenant. Fixe ton premier objectif. Ta famille regarde." },
    ],
    tapToContinue: "Appuie pour continuer",
    letsGo: "C'est parti →",
    next: "Suivant →",
    back: "← Retour",
    skipForNow: "Passer pour l'instant",
  },
  AR: {
    dir: "rtl",
    welcomeTitle: "أهلاً بك في العائلة!",
    welcomeSub: "لنُعِدَّ حسابك في 3 خطوات سريعة.",
    step1Title: "اختر لغتك",
    step1Sub: "يمكنك تغييرها في أي وقت من ملفك الشخصي.",
    step2Title: "أضف كلمة مرور احتياطية",
    step2Sub: "اختياري — للدخول بدون Google. يمكنك تخطّي هذه الخطوة.",
    step2bTitle: "أرِنا وجهك!",
    step2bSub: "أضف صورة ملفك الشخصي حتى تتعرف عليك عائلتك.",
    newPassword: "كلمة مرور جديدة",
    confirmPassword: "تأكيد كلمة المرور",
    passwordMismatch: "كلمتا المرور غير متطابقتين.",
    passwordTooShort: "يجب أن تكون كلمة المرور 8 أحرف على الأقل.",
    saving: "جارٍ الحفظ…",
    continue: "متابعة →",
    storyScreens: [
      { body: "أنت تحب عائلتك. لكن الحياة سحبتكم في اتجاهات مختلفة." },
      { body: "مدن مختلفة. جداول مختلفة. عوالم مختلفة." },
      { body: "أصبحت المكالمات أقصر. وأصبح 'سأبدأ يوم الاثنين' عادة. وفي مكان ما على الطريق، توقفتم عن النمو — معاً." },
      { hook: "Family Quest يغيّر ذلك.", body: "هدف واحد. أسبوع واحد. مال حقيقي على المحك. وعائلتك تراقب." },
      { hook: "لأنه لا شيء يدفعك أكثر من الأشخاص الذين يعرفون تماماً ما أنت قادر عليه.", body: "مرحباً بك في الميثاق. لا تخذل عائلتك." },
    ],
    ruleScreens: [
      { emoji: "⚔️", title: "الأهداف", body: "لديك خانتان للأهداف. الخانة 1 تختارها أنت. الخانة 2 تأتي من عائلتك — هم يرشحون، وأنت تقرر." },
      { emoji: "📅", title: "الدورة الأسبوعية", body: "كل أسبوع يمتد من الاثنين إلى الأحد. سجّل حضورك بدليل لتُثبت أنك التزمت." },
      { emoji: "💸", title: "الغرامات", body: "فاتك أسبوع؟ المال يذهب مباشرة إلى صندوق العائلة. لا عذر." },
      { emoji: "⚡", title: "الأخطاء المتتالية", body: "فاتك أسبوعان متتاليان وعائلتك ستكلّفك بتحدٍّ حقيقي. أكمله أو واجه غرامة أخرى." },
      { emoji: "💰", title: "الصندوق", body: "كل غرامة تُغذّي الصندوق. عندما يكبر بما يكفي، تصوّت العائلة معاً على كيفية إنفاقه." },
      { emoji: "📬", title: "الترشيحات", body: "ترى أحداً يتهاون؟ رشّح له هدفاً. ترشيح واحد لكل شخص في كل مرة." },
      { emoji: "🚀", title: "هل أنت مستعد؟", body: "الميثاق يبدأ الآن. ضع هدفك الأول. عائلتك تراقب." },
    ],
    tapToContinue: "اضغط للمتابعة",
    letsGo: "هيا نبدأ →",
    next: "التالي →",
    back: "→ رجوع",
    skipForNow: "تخطَّ الآن",
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

export default function OnboardingFlow({ userName, skipPasswordStep }: { userName: string; skipPasswordStep: boolean }) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [lang, setLang] = useState<Lang>("EN");
  const [hasGroup, setHasGroup] = useState<boolean | null>(null);

  const copy = COPY[lang];

  const visibleSteps = skipPasswordStep ? ([1, 3, 4] as const) : ([1, 2, 3, 4] as const);
  const visualStep = visibleSteps.indexOf(step as never) + 1;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      dir={copy.dir}
      style={{ background: "#FFFBF0" }}
    >
      {/* Progress dots — hidden when on story/rules (step 4) since overlay covers them */}
      {step !== 4 && (
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
      )}

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
            {copy.welcomeSub.replace("3", String(visibleSteps.length))}
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
      {step !== 4 && (
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
                document.cookie = `LOCALE=${l.toLowerCase()}; path=/; max-age=${365 * 24 * 3600}; samesite=lax`;
              }}
              onNext={() => { playClick(); setStep(skipPasswordStep ? 3 : 2); }}
              copy={copy}
            />
          )}
          {step === 2 && (
            <PasswordStep
              lang={lang}
              onBack={() => { playClick(); setStep(1); }}
              onSuccess={(hg) => { playAcceptNomination(); setHasGroup(hg); setStep(3); }}
              onSkip={() => { playClick(); setStep(3); }}
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
        </div>
      )}

      {step === 4 && (
        <StoryAndRulesFlow
          copy={copy}
          lang={lang}
          skipPasswordStep={skipPasswordStep}
          hasGroup={hasGroup}
        />
      )}
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
  onSkip,
  copy,
}: {
  lang: Lang;
  onBack: () => void;
  onSuccess: (hasGroup: boolean) => void;
  onSkip: () => void;
  copy: (typeof COPY)["EN"];
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
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

      <button
        type="button"
        onClick={onSkip}
        disabled={loading}
        style={{
          fontFamily: "Nunito, sans-serif",
          fontWeight: 700,
          fontSize: "13px",
          background: "transparent",
          color: "#888",
          border: "none",
          padding: "4px",
          cursor: loading ? "not-allowed" : "pointer",
          alignSelf: "center",
          opacity: loading ? 0.5 : 1,
        }}
      >
        {copy.skipForNow}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Avatar upload
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
// Step 4 — Story (5 screens, dark) + Rules (7 screens, light)
// ---------------------------------------------------------------------------

const STORY_COUNT = 5;
const RULE_COUNT = 7;
const TOTAL_SCREENS = STORY_COUNT + RULE_COUNT;

function StoryAndRulesFlow({
  copy,
  lang,
  skipPasswordStep,
  hasGroup,
}: {
  copy: (typeof COPY)["EN"];
  lang: Lang;
  skipPasswordStep: boolean;
  hasGroup: boolean | null;
}) {
  const router = useRouter();
  const [screen, setScreen] = useState(0);
  const [contentOpacity, setContentOpacity] = useState(1);
  const [bgColor, setBgColor] = useState("#1a1a2e");
  const [transitioning, setTransitioning] = useState(false);
  const [completing, setCompleting] = useState(false);

  const isStory = screen < STORY_COUNT;
  const ruleIndex = screen - STORY_COUNT;

  function advanceTo(nextScreen: number) {
    if (transitioning) return;
    setTransitioning(true);
    const crossingBoundary = screen === STORY_COUNT - 1 && nextScreen === STORY_COUNT;

    setContentOpacity(0);

    if (crossingBoundary) {
      // Start bg color transition immediately while story fades out
      setBgColor("#FFFBF0");
      setTimeout(() => {
        setScreen(nextScreen);
        setTimeout(() => {
          setContentOpacity(1);
          setTransitioning(false);
        }, 50);
      }, 380);
    } else {
      setTimeout(() => {
        setScreen(nextScreen);
        setTimeout(() => {
          setContentOpacity(1);
          setTransitioning(false);
        }, 40);
      }, 240);
    }
  }

  async function finish() {
    if (completing) return;
    setCompleting(true);
    let finalHasGroup = hasGroup;

    if (skipPasswordStep) {
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

    router.push(finalHasGroup ? "/profile" : "/groups/new");
  }

  // Shared container style — background transitions between dark and light
  const containerStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 50,
    background: bgColor,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 24px",
    transition: "background 0.5s ease",
    overflowY: "auto",
  };

  // ---- Story screens ----
  if (isStory) {
    const story = copy.storyScreens[screen];
    return (
      <div
        style={containerStyle}
        dir={copy.dir}
        onClick={() => { if (!transitioning) { playClick(); advanceTo(screen + 1); } }}
      >
        {/* 5 story dots */}
        <div style={{ position: "absolute", top: "52px", display: "flex", gap: "8px", pointerEvents: "none" }}>
          {Array.from({ length: STORY_COUNT }).map((_, i) => (
            <div
              key={i}
              style={{
                width: i === screen ? "24px" : "8px",
                height: "8px",
                borderRadius: "100px",
                background: i <= screen ? "#ffffff" : "rgba(255,255,255,0.25)",
                transition: "all 0.3s",
              }}
            />
          ))}
        </div>

        {/* Story text */}
        <div
          style={{
            textAlign: "center",
            maxWidth: "300px",
            opacity: contentOpacity,
            transition: "opacity 0.24s ease",
            pointerEvents: "none",
          }}
        >
          {story.hook && (
            <p
              style={{
                fontFamily: "Bangers, cursive",
                fontSize: "30px",
                letterSpacing: "1.5px",
                color: "#ffffff",
                marginBottom: "16px",
                lineHeight: 1.2,
              }}
            >
              {story.hook}
            </p>
          )}
          <p
            style={{
              fontFamily: "Nunito, sans-serif",
              fontSize: "19px",
              fontWeight: 700,
              color: "rgba(255,255,255,0.85)",
              lineHeight: 1.65,
            }}
          >
            {story.body}
          </p>
        </div>

        {/* Tap hint */}
        <p
          style={{
            position: "absolute",
            bottom: "52px",
            fontFamily: "Nunito, sans-serif",
            fontSize: "13px",
            fontWeight: 600,
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.5px",
            pointerEvents: "none",
          }}
        >
          {copy.tapToContinue}
        </p>
      </div>
    );
  }

  // ---- Rules screens ----
  const rule = copy.ruleScreens[ruleIndex];
  const isLastRule = ruleIndex === RULE_COUNT - 1;

  return (
    <div style={containerStyle} dir={copy.dir}>
      <div style={{ width: "100%", maxWidth: "360px", display: "flex", flexDirection: "column" }}>
        {/* Progress bar */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "6px" }}>
            <span
              style={{
                fontFamily: "Nunito, sans-serif",
                fontSize: "12px",
                fontWeight: 700,
                color: "#888",
              }}
            >
              {screen + 1} / {TOTAL_SCREENS}
            </span>
          </div>
          <div
            style={{
              background: "#e0ddd6",
              borderRadius: "100px",
              height: "6px",
              border: "1.5px solid #1a1a2e",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${((screen + 1) / TOTAL_SCREENS) * 100}%`,
                height: "100%",
                background: "#6c31e3",
                borderRadius: "100px",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        {/* Rule card */}
        <div
          style={{
            background: "#ffffff",
            border: "3px solid #1a1a2e",
            borderRadius: "20px",
            boxShadow: "4px 4px 0 #1a1a2e",
            padding: "32px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "16px",
            opacity: contentOpacity,
            transition: "opacity 0.24s ease",
          }}
        >
          <span style={{ fontSize: "48px", lineHeight: 1 }}>{rule.emoji}</span>
          <h3
            style={{
              fontFamily: "Bangers, cursive",
              fontSize: "28px",
              letterSpacing: "1.5px",
              color: "#1a1a2e",
            }}
          >
            {rule.title}
          </h3>
          <p
            style={{
              fontFamily: "Nunito, sans-serif",
              fontSize: "15px",
              fontWeight: 600,
              color: "#444",
              lineHeight: 1.6,
            }}
          >
            {rule.body}
          </p>
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
          <button
            onClick={() => { playClick(); advanceTo(screen - 1); }}
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
          {isLastRule ? (
            <button
              onClick={() => { playLoginSuccess(); finish(); }}
              disabled={completing}
              style={{
                fontFamily: "Nunito, sans-serif",
                fontWeight: 800,
                fontSize: "15px",
                background: completing ? "#9b7fd4" : "#6c31e3",
                color: "#ffffff",
                border: "2px solid #1a1a2e",
                borderRadius: "100px",
                boxShadow: completing ? "none" : "2px 2px 0 #1a1a2e",
                padding: "10px 24px",
                cursor: completing ? "not-allowed" : "pointer",
                flex: 1,
                opacity: completing ? 0.7 : 1,
              }}
            >
              {completing ? copy.saving : copy.letsGo}
            </button>
          ) : (
            <button
              onClick={() => { playClick(); advanceTo(screen + 1); }}
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
          )}
        </div>
      </div>
    </div>
  );
}
