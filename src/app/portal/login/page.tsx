import { getCurrentPortalUser } from "@/lib/portalAuth";
import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function PortalLoginPage() {
  const user = await getCurrentPortalUser();

  if (user) {
    redirect(user.role === "ADMIN" ? "/portal/admin/inscricoes" : "/portal/minhas-inscricoes");
  }

  return (
    <main className="flex min-h-screen items-center bg-black px-4 py-16">
      <LoginForm />
    </main>
  );
}
