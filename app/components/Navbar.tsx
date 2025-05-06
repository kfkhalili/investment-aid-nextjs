import type { FC } from "react";
import { ThemeToggle } from "@/components/ThemeToggle"; // Import the ThemeToggle component
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { SignedOut, SignedIn } from "@clerk/nextjs";
import {
  StyledSignInButton,
  StyledSignUpButton,
  StyledUserButton,
} from "./StyledClerk";

const Navbar: FC = () => {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <h1 className="text-xl font-semibold text-primary">MarketEcho</h1>
      <div className="ml-auto flex items-center gap-2">
        <SignedOut>
          <ThemeToggle />
          <StyledSignUpButton>
            <Button size="lg">Sign up</Button>
          </StyledSignUpButton>
          <StyledSignInButton>
            <Button
              variant="ghost"
              size="lg"
              className={cn("hover:bg-transparent hover:text-primary")}
            >
              Login
            </Button>
          </StyledSignInButton>
        </SignedOut>

        <SignedIn>
          <ThemeToggle />
          <StyledUserButton />
        </SignedIn>
      </div>
    </header>
  );
};

export default Navbar;
