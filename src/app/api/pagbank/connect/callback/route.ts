import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const PAGBANK_API_BASE =
  process.env.PAGBANK_API_BASE || "https://sandbox.api.pagseguro.com";

const PAGBANK_CLIENT_ID = process.env.PAGBANK_CLIENT_ID;
const PAGBANK_CLIENT_SECRET = process.env.PAGBANK_CLIENT_SECRET;
const PAGBANK_REDIRECT_URI = process.env.PAGBANK_REDIRECT_URI;

type PagBankTokenResponse = {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope?: string;
};

export async function GET(req: NextRequest) {
  try {
    if (!PAGBANK_CLIENT_ID || !PAGBANK_CLIENT_SECRET || !PAGBANK_REDIRECT_URI) {
      return NextResponse.json(
        {
          error:
            "Variáveis ausentes: PAGBANK_CLIENT_ID, PAGBANK_CLIENT_SECRET, PAGBANK_REDIRECT_URI",
        },
        { status: 500 }
      );
    }

    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");
    const state = url.searchParams.get("state");

    if (error) {
      return NextResponse.json(
        {
          error: "Autorização recusada ou inválida no PagBank.",
          providerError: error,
          providerErrorDescription: errorDescription,
          state,
        },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: "Parâmetro 'code' não recebido no callback." },
        { status: 400 }
      );
    }

    const basicAuth = Buffer.from(
      `${PAGBANK_CLIENT_ID}:${PAGBANK_CLIENT_SECRET}`
    ).toString("base64");

    const body = new URLSearchParams();
    body.set("grant_type", "authorization_code");
    body.set("code", code);
    body.set("redirect_uri", PAGBANK_REDIRECT_URI);

    const response = await fetch(`${PAGBANK_API_BASE}/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: body.toString(),
      cache: "no-store",
    });

    const rawText = await response.text();

    let data: PagBankTokenResponse | Record<string, unknown>;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { raw: rawText };
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Falha ao trocar o code por access_token no PagBank.",
          status: response.status,
          details: data,
        },
        { status: 500 }
      );
    }

    const tokenData = data as PagBankTokenResponse;

    return NextResponse.json(
      {
        message:
          "Autorização concluída com sucesso. Salve estes tokens no ambiente.",
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token ?? null,
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in,
        scope: tokenData.scope ?? null,
        next_step: {
          set_env: [
            `PAGBANK_ACCESS_TOKEN=${tokenData.access_token}`,
            tokenData.refresh_token
              ? `PAGBANK_REFRESH_TOKEN=${tokenData.refresh_token}`
              : null,
          ].filter(Boolean),
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Erro no callback Connect PagBank:", err);

    return NextResponse.json(
      { error: "Erro interno no callback do PagBank." },
      { status: 500 }
    );
  }
}