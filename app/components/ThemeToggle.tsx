"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // Import cn

export function ThemeToggle() {
  // Use resolvedTheme to know the actual current theme (light or dark), even if 'system' is set.
  // Use theme to know the user's preference ('light', 'dark', or 'system').
  const { setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    // Toggle between light and dark directly, overriding 'system' preference if necessary.
    if (resolvedTheme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };

  return (
    <Button
      variant="ghost" // Change variant to ghost to remove border
      size="icon"
      onClick={toggleTheme}
      className={cn(
        "hover:bg-transparent hover:text-primary" // Use primary color on hover, remove bg change
      )}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
