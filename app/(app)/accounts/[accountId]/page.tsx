import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getAccountById } from "@/features/accounts/account.service";
import { AccountEditForm } from "@/features/accounts/account-edit-form";

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { accountId } = await params;
  const id = Number(accountId);

  if (!Number.isInteger(id)) {
    notFound();
  }

  const account = await getAccountById(user.id, id);

  if (!account) {
    notFound();
  }

  return (
    <main className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{account.name}</h1>
        <p className="text-sm text-muted-foreground">
          {account.type.replace("_", " ")}
        </p>
      </div>

      <div className="max-w-md">
        <AccountEditForm
          account={{
            id: account.id,
            name: account.name,
            type: account.type,
            balance: account.balance.toNumber(),
            creditLimit: account.creditLimit?.toNumber() ?? null,
          }}
        />
      </div>
    </main>
  );
}