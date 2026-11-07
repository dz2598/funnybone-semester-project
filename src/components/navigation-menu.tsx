"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function NavigationMenu() {
  const pathname = usePathname();

  // Every section is scoped to the signed-in user's profile.
  const navItems = [
    { label: "My Feed", href: "/" },
    { label: "Favorites", href: "/favorites" },
    { label: "Collections", href: "/collections" },
    { label: "Recent", href: "/recent" },
    { label: "Images", href: "/my-images" },
  ];

  return (
    <nav className="hidden sm:flex items-center space-x-2 lg:space-x-4 mx-6">
      {navItems.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/" || pathname?.startsWith("/top-100")
            : pathname === item.href || pathname?.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-base font-medium transition-colors hover:text-primary",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
