import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { AppNavigation } from "@/features/navigation/app-navigation";

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
    <div className="min-h-screen bg-muted/30 md:flex">
      <AppNavigation user={user} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
