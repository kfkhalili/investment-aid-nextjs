/* components/Navbar.tsx */
"use client";

import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import AuthControls from "@/components/AuthControls";

/** main nav links */
const nav = [{ name: "Profiles", href: "/profiles" }] as const;

export default function Navbar() {
  const pathname = usePathname();

  /* utility for <Link> / <DisclosureButton> */
  const linkCls = (href: string, mobile = false) =>
    [
      "rounded-md px-3 py-2 transition",
      mobile ? "block text-base" : "text-sm",
      pathname === href
        ? "bg-gray-200 text-gray-900 dark:bg-gray-900/60 dark:text-white"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-600/40 dark:hover:text-white",
    ].join(" ");

  return (
    /* ───────────────────────────────────────────────── navbar ───────────────────────────────────────────── */
    <Disclosure
      as="nav"
      /* matches the table palette – light & dark */
      className="bg-gray-50/90 backdrop-blur dark:bg-gray-700/40"
    >
      {/* ─────────── desktop bar ─────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* logo + links */}
          <div className="flex items-center">
            <Link href="/" className="shrink-0">
              <Image
                src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
                alt="logo"
                width={32}
                height={32}
                priority
              />
            </Link>

            <nav className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4">
                {nav.map((n) => (
                  <Link key={n.href} href={n.href} className={linkCls(n.href)}>
                    {n.name}
                  </Link>
                ))}
              </div>
            </nav>
          </div>

          {/* right-hand controls */}
          <div className="hidden sm:flex items-center gap-4">
            <ThemeToggle />
            <AuthControls />
          </div>

          {/* mobile burger */}
          <div className="-mr-2 flex sm:hidden">
            <DisclosureButton
              className="group inline-flex items-center justify-center rounded-md p-2
                         text-gray-600 hover:bg-gray-100 hover:text-gray-900
                         focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-400
                         dark:text-gray-300 dark:hover:bg-gray-600/40 dark:hover:text-white
                         dark:focus:ring-white/40"
            >
              <Bars3Icon className="size-6 group-data-open:hidden" />
              <XMarkIcon className="size-6 hidden group-data-open:block" />
            </DisclosureButton>
          </div>
        </div>
      </div>

      {/* ─────────── mobile panel ─────────── */}
      <DisclosurePanel className="sm:hidden">
        <div className="space-y-1 px-2 pb-3 pt-2">
          {nav.map((n) => (
            <DisclosureButton
              key={n.href}
              as={Link}
              href={n.href}
              className={linkCls(n.href, true)}
            >
              {n.name}
            </DisclosureButton>
          ))}

          {/* theme + auth side-by-side */}
          <div className="pt-4 flex items-center gap-4">
            <ThemeToggle />
            <AuthControls />
          </div>
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}
