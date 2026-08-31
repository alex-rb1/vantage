import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteSession, getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    session: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

describe("getCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when there is no session cookie", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const user = await getCurrentUser();

    expect(user).toBeNull();
    expect(prisma.session.findUnique).not.toHaveBeenCalled();
  });

  it("returns the user for a valid session", async () => {
  mockCookieStore.get.mockReturnValue({
    value: "valid-token",
  });

  vi.mocked(prisma.session.findUnique).mockResolvedValue({
    id: 1,
    token: "valid-token",
    userId: 1,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    createdAt: new Date(),
    user: {
      id: 1,
      name: "Alex",
      email: "alex@example.com",
      passwordHash: "stored-hash",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  } as never);

  const user = await getCurrentUser();

  expect(prisma.session.findUnique).toHaveBeenCalledWith({
    where: { token: "valid-token" },
    include: { user: true },
  });

  expect(user).toEqual({
    id: 1,
    name: "Alex",
    email: "alex@example.com",
  });
});

it("deletes an expired session and clears the cookie", async () => {
  mockCookieStore.get.mockReturnValue({
    value: "expired-token",
  });

  vi.mocked(prisma.session.findUnique).mockResolvedValue({
    id: 2,
    token: "expired-token",
    userId: 1,
    expiresAt: new Date(Date.now() - 1000),
    createdAt: new Date(),
    user: {
      id: 1,
      name: "Alex",
      email: "alex@example.com",
      passwordHash: "stored-hash",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  } as never);

  const user = await getCurrentUser();

  expect(prisma.session.delete).toHaveBeenCalledWith({
    where: { id: 2 },
  });

  expect(mockCookieStore.delete).toHaveBeenCalledWith("session");

  expect(user).toBeNull();
});
});

describe("deleteSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes the database session and clears the cookie", async () => {
    mockCookieStore.get.mockReturnValue({
      value: "valid-token",
    });

    await deleteSession();

    expect(prisma.session.deleteMany).toHaveBeenCalledWith({
      where: { token: "valid-token" },
    });

    expect(mockCookieStore.delete).toHaveBeenCalledWith("session");
  });
});