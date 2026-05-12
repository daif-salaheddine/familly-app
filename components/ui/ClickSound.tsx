"use client";

import { useEffect } from "react";
import { playClick } from "../../lib/sounds";

export default function ClickSound() {
  useEffect(() => {
    function handleClick() {
      playClick();
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
