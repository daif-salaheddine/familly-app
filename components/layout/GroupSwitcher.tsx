"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Group {
  id: string;
  name: string;
  isAdmin: boolean;
}

interface GroupSwitcherProps {
  groups: Group[];
  activeGroupId: string;
}

export default function GroupSwitcher({ groups, activeGroupId }: GroupSwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeGroup = groups.find((g) => g.id === activeGroupId) ?? groups[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function switchGroup(groupId: string) {
    if (groupId === activeGroupId || switching) return;
    setSwitching(true);
    setOpen(false);
    await fetch("/api/user/active-group", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId }),
    });
    router.refresh();
    setSwitching(false);
  }

  // Single group — just show the name + optional settings link
  if (groups.length <= 1) {
    return (
      <div className="flex items-center gap-2">
        <span
          style={{
            fontFamily: "Bangers, cursive",
            fontSize: "22px",
            letterSpacing: "1px",
            color: "#1a1a2e",
          }}
        >
          {activeGroup?.name ?? "Family Quest"}
        </span>
        {activeGroup?.isAdmin && (
          <Link
            href={`/groups/${activeGroup.id}/settings`}
            title="Group settings"
            style={{ fontSize: "16px", lineHeight: 1, color: "#888", textDecoration: "none" }}
          >
            ⚙️
          </Link>
        )}
      </div>
    );
  }

  // Multiple groups — show dropdown switcher
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          fontFamily: "Bangers, cursive",
          fontSize: "22px",
          letterSpacing: "1px",
          color: "#1a1a2e",
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: 0,
          opacity: switching ? 0.6 : 1,
        }}
      >
        {activeGroup?.name ?? "Family Quest"}
        <span style={{ fontSize: "14px", marginTop: "2px" }}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            minWidth: "160px",
            background: "#ffffff",
            border: "3px solid #1a1a2e",
            borderRadius: "12px",
            boxShadow: "3px 3px 0 #1a1a2e",
            zIndex: 50,
            overflow: "hidden",
          }}
        >
          {groups.map((group) => (
            <div key={group.id} style={{ borderBottom: "1px solid #e5e5e5", display: "flex", alignItems: "center" }}>
              <button
                onClick={() => switchGroup(group.id)}
                style={{
                  flex: 1,
                  textAlign: "left",
                  padding: "10px 14px",
                  fontFamily: "Nunito, sans-serif",
                  fontSize: "14px",
                  fontWeight: group.id === activeGroupId ? 800 : 600,
                  color: "#1a1a2e",
                  background: group.id === activeGroupId ? "#f0ebff" : "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {group.id === activeGroupId && "✓ "}
                {group.name}
              </button>
              {group.isAdmin && (
                <Link
                  href={`/groups/${group.id}/settings`}
                  onClick={() => setOpen(false)}
                  title="Settings"
                  style={{ padding: "10px 12px", fontSize: "14px", color: "#888", textDecoration: "none" }}
                >
                  ⚙️
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
