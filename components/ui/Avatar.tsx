const SIZE_CLASSES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-2xl",
};

export default function Avatar({
  name,
  url,
  size = "md",
}: {
  name: string;
  url?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = SIZE_CLASSES[size];

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        className={`${sizeClass} rounded-full object-cover shrink-0`}
        style={{ border: "3px solid #1a1a2e" }}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-bold shrink-0`}
      style={{
        background: "#6c31e3",
        color: "#ffffff",
        border: "3px solid #1a1a2e",
        fontFamily: "Nunito, sans-serif",
      }}
    >
      {name[0]}
    </div>
  );
}
