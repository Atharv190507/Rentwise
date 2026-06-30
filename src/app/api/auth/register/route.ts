import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createToken, verifyToken, getTokenFromHeader } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role, businessName, phone, description } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);
    const userRole = role === "VENDOR" ? "VENDOR" : "CUSTOMER";

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: userRole,
        phone: phone || null,
      },
    });

    if (userRole === "VENDOR" && businessName) {
      await db.vendor.create({
        data: {
          userId: user.id,
          businessName,
          phone: phone || null,
          description: description || null,
        },
      });
    }

    const token = await createToken({ userId: user.id, email: user.email, role: user.role });
    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone },
      token,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Registration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromHeader(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      include: { vendor: true },
      select: {
        id: true, name: true, email: true, role: true, phone: true, avatar: true,
        vendor: { select: { id: true, businessName: true, isVerified: true, isSuspended: true } },
      },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}