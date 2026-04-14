"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  emoji: string;
}

export default function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/profile") {
      // /profile is active for /profile and all /profile/* sub-routes,
      // but NOT for other top-level routes that start differently.
      return pathname === "/profile" || pathname.startsWith("/profile/");
    }
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-10">
      <div
        className="max-w-2xl mx-auto flex"
        style={{
          background: "#ffffff",
          border: "3px solid #1a1a2e",
          borderRadius: "20px",
          boxShadow: "3px 3px 0 #1a1a2e",
        }}
      >
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 py-2 flex flex-col items-center gap-0.5 transition-colors hover:opacity-80"
              style={{
                fontFamily: "Bangers, cursive",
                fontSize: "10px",
                letterSpacing: "1px",
                color: active ? "#6c31e3" : "#888",
                fontWeight: active ? 800 : 400,
                textTransform: "uppercase",
              }}
            >
              <span
                className="text-base leading-none"
                style={{ filter: active ? "none" : "grayscale(0.3)" }}
              >
                {item.emoji}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
