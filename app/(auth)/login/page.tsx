import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/features/auth/login-form";

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ reason?: string }>;
}) {
    const params = await searchParams;
    const authRequired = params.reason === "auth-required";
    
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>
            Log in to your Vantage account.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <LoginForm />
          {authRequired && (
            <div className="mt-4 text-center text-sm text-destructive">
            Log in to continue to Vantage.
            </div>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-foreground underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}