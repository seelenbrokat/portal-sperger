import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    product: "sperger-portal",
    brand: "Spedition Sperger",
    host: "sperger.logistikberater.at",
    separatedFrom: "wog",
  });
}
