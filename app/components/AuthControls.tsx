/* components/AuthControls.tsx */
"use client";

import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import { useMemo } from "react";

const clerkPalette = {
  light: {
    bg: "#ffffff", // = var(--background)
    fg: "#171717", // = var(--foreground)
    primary: "#2563eb", // Tailwind blue-600
    inputBg: "#ffffff",
  },
  dark: {
    bg: "#111827", // gray-900
    fg: "#f3f4f6", // gray-100
    primary: "#60a5fa", // blue-400
    inputBg: "#1f2937", // gray-800
  },
};

interface Props {
  className?: string;
}

export default function AuthControls({ className = "" }: Props) {
  const { resolvedTheme } = useTheme();
  const pal = clerkPalette[resolvedTheme === "dark" ? "dark" : "light"];

  /* one appearance object reused everywhere */
  const appearance = useMemo(
    () => ({
      ...(resolvedTheme === "dark" && { baseTheme: dark }),
      variables: {
        colorBackground: pal.bg,
        colorText: pal.fg,
        colorPrimary: pal.primary,
        colorInputBackground: pal.inputBg,
      },
    }),
    [pal, resolvedTheme]
  );

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* ------------  not signed in  ------------- */}
      <SignedOut>
        <SignInButton
          key={`sign-in-${resolvedTheme}`} /* remount on toggle */
          mode="modal"
          appearance={appearance}
        />
        <SignUpButton
          key={`sign-up-${resolvedTheme}`}
          mode="modal"
          appearance={appearance}
        />
      </SignedOut>

      {/* ------------    signed in   -------------- */}
      <SignedIn>
        <UserButton
          key={`user-${resolvedTheme}`}
          afterSignOutUrl="/"
          appearance={{
            ...appearance,
            elements: {
              userButtonAvatarBox:
                "h-10 w-10 rounded-full ring-1 ring-zinc-900/5 dark:ring-white/10",
              userButtonAvatarImage: "rounded-full",
            },
          }}
        />
      </SignedIn>
    </div>
  );
}
