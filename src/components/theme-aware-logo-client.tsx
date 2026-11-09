"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function ThemeAwareLogoClient() {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  usePathname();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    const id = requestAnimationFrame(() => {
      setMounted(true);
      checkMobile();
    });

    window.addEventListener("resize", checkMobile);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  if (!mounted) {
    return null;
  }

  const logoHref = "/";

  return (
    <Link
      href={logoHref}
      className="font-mono text-sm sm:text-base font-bold tracking-[0.14em] text-primary"
      aria-label="Campus LOL personal meme archive"
    >
      {isMobile ? "C://LOL" : "C://LOL  [ MY_MEMES.exe ]"}
    </Link>
  );
}
