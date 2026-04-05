"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ShoppingBag } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const wasReset = searchParams.get("reset") === "1";
  const t = useTranslations("login");

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error === "account_deactivated") {
      setError(t("accountDeactivated"));
    } else if (result?.error) {
      setError(t("invalidCredentials"));
    } else {
      router.push(callbackUrl);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-white p-8 shadow-sm"
    >
      {wasReset && (
        <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          {t("passwordResetSuccess")}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <Input
          id="email"
          label={t("labelEmail")}
          type="email"
          placeholder={t("placeholderEmail")}
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          required
        />
        <Input
          id="password"
          label={t("labelPassword")}
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          required
        />
      </div>

      <Button type="submit" className="mt-6 w-full" isLoading={loading}>
        {t("submitButton")}
      </Button>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link href="/forgot-password" className="text-brand-600 hover:underline">
          {t("forgotPassword")}
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  const t = useTranslations("login");

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600">
            <ShoppingBag className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("noAccount")}{" "}
            <Link href="/register" className="text-brand-600 hover:underline">
              {t("registerLink")}
            </Link>
          </p>
        </div>

        <Suspense fallback={<div className="rounded-xl border border-border bg-white p-8 shadow-sm" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
