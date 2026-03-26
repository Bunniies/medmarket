"use client";

import { Suspense, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ShoppingBag, Building2 } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface InviteInfo {
  email: string;
  hospital: { id: string; name: string; city: string; country: string };
}

function RegisterForm() {
  const router = useRouter();
  const t = useTranslations("register");
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("token");

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [inviteError, setInviteError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    hospitalName: "",
    hospitalCity: "",
    hospitalCountry: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If there's an invite token, validate it and pre-fill email
  useEffect(() => {
    if (!inviteToken) return;
    fetch(`/api/invitations/${inviteToken}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setInviteError(data.error);
        } else {
          setInviteInfo(data);
          setForm((f) => ({ ...f, email: data.email }));
        }
      })
      .catch(() => setInviteError("Failed to load invitation."));
  }, [inviteToken]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = inviteToken
      ? { name: form.name, email: form.email, password: form.password, token: inviteToken }
      : form;

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? t("errorFallback"));
    } else {
      router.push("/login?registered=1");
    }
  }

  // Invalid / expired token
  if (inviteToken && inviteError) {
    return (
      <div className="w-full max-w-md rounded-xl border border-border bg-white p-8 text-center shadow-sm">
        <p className="text-lg font-semibold text-red-600">{inviteError}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t("inviteInvalidHint")}</p>
        <Link href="/register" className="mt-4 inline-block text-sm text-brand-600 hover:underline">
          {t("registerNewHospital")}
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-gray-900">
        {inviteInfo ? t("titleInvite") : t("title")}
      </h1>
      <p className="text-sm text-muted-foreground">
        {t("alreadyRegistered")}{" "}
        <Link href="/login" className="text-brand-600 hover:underline">
          {t("signInLink")}
        </Link>
      </p>

      {/* Invite context banner */}
      {inviteInfo && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
          <Building2 className="h-5 w-5 shrink-0 text-brand-600" />
          <div>
            <p className="text-sm font-medium text-brand-900">
              {t("joiningHospital", { name: inviteInfo.hospital.name })}
            </p>
            <p className="text-xs text-brand-700">
              {inviteInfo.hospital.city}, {inviteInfo.hospital.country}
            </p>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-4 rounded-xl border border-border bg-white p-8 shadow-sm"
      >
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("sectionAccount")}
        </p>
        <div className="flex flex-col gap-4">
          <Input
            id="name"
            name="name"
            label={t("labelName")}
            placeholder={t("placeholderName")}
            value={form.name}
            onChange={handleChange}
            required
          />
          <Input
            id="email"
            name="email"
            label={t("labelEmail")}
            type="email"
            placeholder={t("placeholderEmail")}
            value={form.email}
            onChange={handleChange}
            required
            readOnly={!!inviteInfo}
          />
          <Input
            id="password"
            name="password"
            label={t("labelPassword")}
            type="password"
            placeholder={t("placeholderPassword")}
            value={form.password}
            onChange={handleChange}
            required
            minLength={8}
          />
        </div>

        {/* Hospital section — only for new hospital registrations */}
        {!inviteInfo && (
          <>
            <p className="mb-4 mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("sectionHospital")}
            </p>
            <div className="flex flex-col gap-4">
              <Input
                id="hospitalName"
                name="hospitalName"
                label={t("labelHospitalName")}
                placeholder={t("placeholderHospitalName")}
                value={form.hospitalName}
                onChange={handleChange}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="hospitalCity"
                  name="hospitalCity"
                  label={t("labelCity")}
                  placeholder={t("placeholderCity")}
                  value={form.hospitalCity}
                  onChange={handleChange}
                  required
                />
                <Input
                  id="hospitalCountry"
                  name="hospitalCountry"
                  label={t("labelCountry")}
                  placeholder={t("placeholderCountry")}
                  value={form.hospitalCountry}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </>
        )}

        <p className="mt-4 text-xs text-muted-foreground">
          {t("termsNotice")}{" "}
          <Link href="/terms" className="text-brand-600 hover:underline">{t("termsLink")}</Link>{" "}
          {t("and")}{" "}
          <Link href="/privacy" className="text-brand-600 hover:underline">{t("privacyLink")}</Link>.{" "}
          {!inviteInfo && t("verificationNotice")}
        </p>

        <Button type="submit" className="mt-6 w-full" isLoading={loading}>
          {t("submitButton")}
        </Button>
      </form>
    </>
  );
}

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600">
            <ShoppingBag className="h-6 w-6 text-white" />
          </div>
          <Suspense fallback={<div className="h-6" />}>
            <RegisterForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
