import Link from "next/link";
import SetPasswordForm from "./SetPasswordForm";

export const dynamic = "force-dynamic";

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="flex min-h-screen items-center bg-black px-4 py-16">
      {token ? (
        <SetPasswordForm token={token} />
      ) : (
        <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-black/75 p-6 text-sm text-zinc-200">
          <h1 className="heading-adventure text-3xl text-white">Link inválido</h1>
          <p className="mt-3 text-zinc-400">
            Solicite um novo link de definição de senha na tela de login.
          </p>
          <Link
            href="/portal/login"
            className="mt-6 inline-flex rounded-full bg-orange-500 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-black"
          >
            Ir para login
          </Link>
        </div>
      )}
    </main>
  );
}
