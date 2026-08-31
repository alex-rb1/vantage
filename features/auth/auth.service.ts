import bcrypt from "bcrypt";
import { prisma } from "@/lib/db/prisma";

export async function signup(
  name: string,
  email: string,
  password: string
) {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("Email already in use");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  return user;
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!passwordMatches) {
    throw new Error("Invalid email or password");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}