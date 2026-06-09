import type { Metadata } from "next";
import { LoginPageShell } from "./LoginPageShell";

export const metadata: Metadata = { title: "Sign In" };

export default function LoginPage() {
  return <LoginPageShell />;
}
