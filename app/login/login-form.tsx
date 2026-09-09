"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/portal`,
      },
    });
    setSending(false);
    setMessage(
      error
        ? "We could not find an approved partner account for that email."
        : "Check your email for your secure sign-in link.",
    );
  }

  return (
    <form onSubmit={submit} className="mt-7 space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2"
        />
      </div>
      {message && <p className="text-sm text-slate-700">{message}</p>}
      <Button disabled={sending} className="w-full">
        {sending ? "Sending…" : "Email my secure sign-in link"}
      </Button>
    </form>
  );
}
