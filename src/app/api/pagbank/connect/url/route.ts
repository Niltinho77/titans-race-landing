import { NextResponse } from "next/server";

export const runtime = "nodejs";

const PAGBANK_CLIENT_ID = process.env.PAGBANK_CLIENT_ID;
const PAGBANK_REDIRECT_URI = process.env.PAGBANK_REDIRECT_URI;
const PAGBANK_CONNECT_BASE =
  process.env.PAGBANK_CONNECT_BASE || "https://connect.sandbox.pagbank.com.br";

export async function GET() {
  if (!PAGBANK_CLIENT_ID || !PAGBANK_REDIRECT_URI) {
    return NextResponse.json(
      {
        error:
          "Variáveis ausentes: PAGBANK_CLIENT_ID e/ou PAGBANK_REDIRECT_URI",
      },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: PAGBANK_CLIENT_ID,
    redirect_uri: PAGBANK_REDIRECT_URI,
    scope: "checkout.create checkout.view payments.read payments.create",
    state: "titansrace-connect",
  });

  const authorizationUrl = `${PAGBANK_CONNECT_BASE}/oauth2/authorize?${params.toString()}`;

  return NextResponse.json({ authorizationUrl });
}