import { sendEmail } from "@/lib/email";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const to = searchParams.get("to");

  if (!to) {
    return NextResponse.json({ error: "Pass ?to=email@example.com" }, { status: 400 });
  }

  try {
    await sendEmail({
      to,
      subject: "Campsite test email",
      html: "<p>If you see this, email notifications are working!</p>",
    });
    return NextResponse.json({ ok: true, sentTo: to });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
