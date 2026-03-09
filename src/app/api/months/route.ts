import { NextResponse } from "next/server";
import { getAvailableMonths } from "@/lib/queries";

export async function GET() {
  const months = await getAvailableMonths();
  return NextResponse.json(months);
}
