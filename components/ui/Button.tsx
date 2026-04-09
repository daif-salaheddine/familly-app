"use client";

import React from "react";

type ButtonVariant = "primary" | "success" | "danger" | "ghost";

const VARIANT_STYLES: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: "#6c31e3",
    color: "#ffffff",
    border: "2px solid #1a1a2e",
    boxShadow: "2px 2px 0 #1a1a2e",
  },
  success: {
    background: "#2ecc71",
    color: "#1a1a2e",
    border: "2px solid #1a1a2e",
    boxShadow: "2px 2px 0 #1a1a2e",
  },
  danger: {
    background: "#e74c3c",
    color: "#ffffff",
    border: "2px solid #1a1a2e",
    boxShadow: "2px 2px 0 #1a1a2e",
  },
  ghost: {
    background: "#ffffff",
    color: "#1a1a2e",
    border: "2px solid #1a1a2e",
    boxShadow: "2px 2px 0 #1a1a2e",
  },
};

const BASE_STYLE: React.CSSProperties = {
  fontFamily: "Nunito, sans-serif",
  fontWeight: 800,
  borderRadius: "100px",
  padding: "8px 20px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  transition: "opacity 0.15s",
  fontSize: "14px",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export default function Button({
  variant = "primary",
  style,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      style={{ ...BASE_STYLE, ...VARIANT_STYLES[variant], ...style }}
    >
      {children}
    </button>
  );
}
