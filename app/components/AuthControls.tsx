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

/* palette for Clerk’s modal */
const clerkPalette = {
  light: {
    bg: "#ffffff",
    fg: "#171717",
    primary: "#2563eb",
    inputBg: "#ffffff",
  },
  dark: {
    bg: "#111827",
    fg: "#f3f4f6",
    primary: "#60a5fa",
    inputBg: "#1f2937",
  },
} as const;

/* the same “idle link” styles used in Navbar */
const navLinkClasses =
  "rounded-md px-3 py-2 text-sm transition " +
  "text-gray-600 hover:bg-gray-100 hover:text-gray-900 " +
  "dark:text-gray-300 dark:hover:bg-gray-600/40 dark:hover:text-white";

interface Props {
  className?: string;
}

export default function AuthControls({ className = "" }: Props) {
  const { resolvedTheme } = useTheme();
  const pal = clerkPalette[resolvedTheme === "dark" ? "dark" : "light"];

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
      {/* ─────────── signed-out ─────────── */}
      <SignedOut>
        <SignInButton
          mode="modal"
          appearance={appearance}
          key={`signin-${resolvedTheme}`}
        >
          <button className={navLinkClasses}>Sign&nbsp;in</button>
        </SignInButton>

        <SignUpButton
          mode="modal"
          appearance={appearance}
          key={`signup-${resolvedTheme}`}
        >
          <button className={navLinkClasses}>Create&nbsp;Account</button>
        </SignUpButton>
      </SignedOut>

      {/* ─────────── signed-in ─────────── */}
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
