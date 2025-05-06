/* components/AuthControls.tsx */
"use client";

import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import { useMemo } from "react";

/* palette for Clerk’s modal */
const clerkPalette = {
  light: {
    bg: "#fafafa",
    fg: "#171717",
    primary: "#2a2d7a",
    inputBg: "#ffffff",
  },
  dark: {
    bg: "#09090B",
    fg: "#f3f4f6",
    primary: "#8c93dd",
    inputBg: "#1f2937",
  },
} as const;

export function StyledSignUpButton({
  children,
}: {
  children: React.ReactNode;
}) {
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
    <SignUpButton
      mode="modal"
      appearance={appearance}
      key={`signup-${resolvedTheme}`}
    >
      {children}
    </SignUpButton>
  );
}

export function StyledSignInButton({
  children,
}: {
  children: React.ReactNode;
}) {
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
    <SignInButton
      mode="modal"
      appearance={appearance}
      key={`signin-${resolvedTheme}`}
    >
      {children}
    </SignInButton>
  );
}

export function StyledUserButton() {
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
    <UserButton
      key={`user-${resolvedTheme}`}
      appearance={{
        ...appearance,
        elements: {
          userButtonAvatarBox:
            "h-10 w-10 rounded-full ring-1 ring-zinc-900/5 dark:ring-white/10",
          userButtonAvatarImage: "rounded-full",
        },
      }}
    />
  );
}
