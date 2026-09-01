import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { logoutAction } from "@/features/auth/auth.actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?reason=auth-required");
  }

  return (
    <div>
      <aside>
        <h1>Vantage</h1>

        <nav>
          <a href="/dashboard">Dashboard</a>
          <Link href="/accounts">Accounts</Link>
          <Link href="/categories">
            Categories
          </Link>
          <a href="/transactions">Transactions</a>
          <a href="/budgets">Budgets</a>
          <a href="/goals">Goals</a>
          <a href="/strategies">Strategies</a>
          <a href="/reviews">Reviews</a>
        </nav>

        <form action={logoutAction}>
          <Button type="submit" variant="outline">
            Log out
          </Button>
        </form>
      </aside>

      <main>{children}</main>
    </div>
  );
}