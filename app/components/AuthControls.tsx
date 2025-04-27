"use client";

import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import ThemeToggle from "@/components/ThemeToggle";

interface Props {
  className?: string;
}

export default function AuthControls({ className = "" }: Props) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <ThemeToggle />

      <SignedOut>
        <SignInButton mode="modal" />
        <SignUpButton mode="modal" />
      </SignedOut>

      <SignedIn>
        <UserButton />
      </SignedIn>
    </div>
  );
}
