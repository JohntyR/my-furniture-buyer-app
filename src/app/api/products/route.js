import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const products = await prisma.product.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json(products);
}
