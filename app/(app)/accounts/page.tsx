import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getAccounts } from "@/features/accounts/account.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountForm } from "@/features/accounts/account-form";
import Link from "next/link";

export default async function AccountsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const accounts = await getAccounts(user.id);

  return (
    <main className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Accounts</h1>
        <p className="text-sm text-muted-foreground">
          Manage where your money lives.
        </p>
      </div>
        <div className="mb-8 max-w-md">
            <AccountForm />
        </div>

      {accounts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You haven&apos;t added any accounts yet.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => (
            <Link
                key={account.id}
                href={`/accounts/${account.id}`}
            >
                <Card key={account.id}>
                <CardHeader>
                    <CardTitle>{account.name}</CardTitle>
                </CardHeader>

                <CardContent>
                    <p className="text-sm text-muted-foreground">
                    {account.type.replace("_", " ")}
                    </p>

                    <p className="mt-2 text-2xl font-semibold">
                    ${account.balance.toFixed(2)}
                    </p>

                    {account.type === "CREDIT_CARD" &&
                    account.creditLimit !== null && (
                        <p className="mt-2 text-sm text-muted-foreground">
                        Limit: ${account.creditLimit.toFixed(2)}
                        </p>
                    )}
                </CardContent>
                </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}