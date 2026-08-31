"use server";

import type { AuthActionState } from "./auth.types";
import { redirect } from "next/navigation";
import { loginSchema, signupSchema } from "./auth.schemas";
import { login, signup } from "./auth.service";
import { createSession, deleteSession } from "@/lib/auth/session";

export async function signupAction(
  prevState: AuthActionState,
  formData: FormData
) {
  const result = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return {
      error: "Please check your signup information.",
    };
  }

  try {
    const user = await signup(
      result.data.name,
      result.data.email,
      result.data.password
    );

    await createSession(user.id);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Email already in use"
    ) {
      return {
        error: "Email already in use.",
      };
    }

    throw error;
  }

  redirect("/dashboard");
}

export async function loginAction(
  prevState: AuthActionState,
  formData: FormData
) {
  const result = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return {
      error: "Please check your login information.",
    };
  }

  try {
    const user = await login(
      result.data.email,
      result.data.password
    );

    await createSession(user.id);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Invalid email or password"
    ) {
      return {
        error: "Invalid email or password.",
      };
    }

    throw error;
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}