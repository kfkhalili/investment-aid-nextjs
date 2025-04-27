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
import AuthControls from "@/components/AuthControls";

const nav = [{ name: "Companies", href: "/companies" }] as const;

export default function Navbar() {
  const pathname = usePathname();
  const linkCls = (href: string, mobile = false) =>
    [
      "rounded-md px-3 py-2 transition",
      mobile ? "block text-base" : "text-sm",
      pathname === href
        ? "bg-gray-900 text-white"
        : "text-gray-300 hover:bg-gray-700 hover:text-white",
    ].join(" ");

  return (
    <Disclosure as="nav" className="bg-gray-800">
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
                className="h-8 w-auto"
                priority
              />
            </Link>

            <div className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4">
                {nav.map((n) => (
                  <Link key={n.href} href={n.href} className={linkCls(n.href)}>
                    {n.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* desktop auth/theme */}
          <AuthControls className="hidden sm:flex" />

          {/* burger */}
          <div className="-mr-2 flex sm:hidden">
            <DisclosureButton className="group inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:ring-2 focus:ring-inset focus:ring-white">
              <Bars3Icon className="size-6 group-data-open:hidden" />
              <XMarkIcon className="size-6 hidden group-data-open:block" />
            </DisclosureButton>
          </div>
        </div>
      </div>

      {/* mobile panel */}
      <DisclosurePanel className="sm:hidden">
        <div className="space-y-1 px-2 pt-2 pb-3">
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

          <AuthControls className="pt-4" />
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}
