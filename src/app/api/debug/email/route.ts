import { NextResponse } from "next/server";
import { resend, EMAIL_FROM } from "@/lib/resend";

export async function GET() {
  console.log("EMAIL_FROM:", EMAIL_FROM);
  console.log("RESEND_API_KEY présente:", !!process.env.RESEND_API_KEY);

  const result = await resend.emails.send({
    from: EMAIL_FROM,
    to: "theo.coll36@gmail.com",
    subject: "Test email Artisanat Cases",
    html: "<p>Test email depuis l'app.</p>",
  });

  console.log("Résultat Resend:", JSON.stringify(result));
  return NextResponse.json(result);
}
