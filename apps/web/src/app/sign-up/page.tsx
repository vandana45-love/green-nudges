"use client";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-50">
      <SignUp routing="hash" />
    </div>
  );
}
