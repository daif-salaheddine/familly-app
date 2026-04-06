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
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold shrink-0`}
    >
      {name[0]}
    </div>
  );
}
