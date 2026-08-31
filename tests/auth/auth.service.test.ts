import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/db/prisma";
import { login, signup } from "@/features/auth/auth.service";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

describe("signup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an email that is already in use", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 1,
      name: "Existing User",
      email: "test@example.com",
      passwordHash: "hash",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      signup("Alex", "test@example.com", "password123")
    ).rejects.toThrow("Email already in use");

    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});

describe("login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects when the user does not exist", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(
      login("missing@example.com", "password123")
    ).rejects.toThrow("Invalid email or password");
  });

  it("rejects an incorrect password", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 1,
      name: "Alex",
      email: "alex@example.com",
      passwordHash: "stored-hash",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    await expect(
      login("alex@example.com", "wrong-password")
    ).rejects.toThrow("Invalid email or password");
  });

  it("returns safe user data for valid credentials", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 1,
      name: "Alex",
      email: "alex@example.com",
      passwordHash: "stored-hash",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const user = await login(
      "alex@example.com",
      "password123"
    );

    expect(bcrypt.compare).toHaveBeenCalledWith(
      "password123",
      "stored-hash"
    );

    expect(user).toEqual({
      id: 1,
      name: "Alex",
      email: "alex@example.com",
    });
  });
});

it("creates a user with a hashed password", async () => {
  vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

  vi.mocked(bcrypt.hash).mockResolvedValue("hashed-password" as never);

  vi.mocked(prisma.user.create).mockResolvedValue({
    id: 1,
    name: "Alex",
    email: "alex@example.com",
  } as never);

  const user = await signup(
    "Alex",
    "alex@example.com",
    "password123"
  );

  expect(bcrypt.hash).toHaveBeenCalledWith("password123", 12);

  expect(prisma.user.create).toHaveBeenCalledWith({
    data: {
      name: "Alex",
      email: "alex@example.com",
      passwordHash: "hashed-password",
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  expect(user).toEqual({
    id: 1,
    name: "Alex",
    email: "alex@example.com",
  });
});

