"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Analytics02Icon,
  ChartAnalysisIcon,
  Home04Icon,
  Logout01Icon,
  StrategyIcon,
  Tag01Icon,
  Target01Icon,
  TransactionIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { logoutAction } from "@/features/auth/auth.actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigationItems = [
  { label: "Dashboard", href: "/dashboard", icon: Home04Icon },
  { label: "Accounts", href: "/accounts", icon: Wallet01Icon },
  { label: "Categories", href: "/categories", icon: Tag01Icon },
  { label: "Transactions", href: "/transactions", icon: TransactionIcon },
] as const;

const roadmapItems = [
  { label: "Budgets", icon: Analytics02Icon },
  { label: "Goals", icon: Target01Icon },
  { label: "Strategies", icon: StrategyIcon },
  { label: "Reviews", icon: ChartAnalysisIcon },
] as const;

type AppNavigationProps = {
  user: {
    name: string;
    email: string;
  };
};

export function AppNavigation({ user }: AppNavigationProps) {
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur md:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
            Vantage
          </Link>

          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="icon" aria-label="Log out">
              <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} />
            </Button>
          </form>
        </div>

        <nav aria-label="Primary navigation" className="flex gap-1 overflow-x-auto px-3 pb-3">
          {navigationItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  buttonVariants({ variant: active ? "secondary" : "ghost", size: "sm" }),
                  "shrink-0"
                )}
                aria-current={active ? "page" : undefined}
              >
                <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-sidebar p-4 md:flex">
        <div className="px-2 pb-6 pt-2">
          <Link href="/dashboard" className="text-xl font-semibold tracking-tight">
            Vantage
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            Personal finance, with perspective.
          </p>
        </div>

        <nav aria-label="Primary navigation" className="space-y-1">
          {navigationItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  buttonVariants({ variant: active ? "secondary" : "ghost" }),
                  "w-full justify-start"
                )}
                aria-current={active ? "page" : undefined}
              >
                <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 border-t pt-5">
          <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Coming later
          </p>
          <div className="space-y-1">
            {roadmapItems.map((item) => (
              <div
                key={item.label}
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "w-full justify-start text-muted-foreground opacity-60"
                )}
                aria-disabled="true"
              >
                <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                {item.label}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto border-t pt-4">
          <div className="mb-3 min-w-0 px-3">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>

          <form action={logoutAction}>
            <Button type="submit" variant="outline" className="w-full justify-start">
              <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} />
              Log out
            </Button>
          </form>
        </div>
      </aside>
    </>
  );
}
