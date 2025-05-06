import type { FC } from "react";
import { ThemeToggle } from "@/components/theme-toggle"; // Import the ThemeToggle component
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { SignUpButton, SignInButton } from "@clerk/nextjs";

const Navbar: FC = () => {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <h1 className="text-xl font-semibold text-primary">MarketEcho</h1>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <Button variant="default" size="sm">
          <SignUpButton mode="modal" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn("hover:bg-transparent hover:text-primary")}
        >
          <SignInButton mode="modal"></SignInButton>
        </Button>
      </div>
    </header>
  );
};

export default Navbar;
