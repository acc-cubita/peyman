import type { Metadata } from "next";
import { Suspense } from "react";
import { requireCustomer } from "@/lib/customer-auth";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "اطلاعات حساب" };

export default function ProfilePage() {
  return (
    <Suspense fallback={<div aria-hidden className="h-72 rounded-3xl bg-line/50" />}>
      <Profile />
    </Suspense>
  );
}

async function Profile() {
  const customer = await requireCustomer("/account/profile");
  return (
    <>
      <h1 className="mb-6 font-display text-4xl text-board">اطلاعات حساب</h1>
      <section className="rounded-2xl bg-surface p-6 ring-1 ring-line">
        <ProfileForm name={customer.name ?? ""} mobile={customer.mobile} />
      </section>
    </>
  );
}
