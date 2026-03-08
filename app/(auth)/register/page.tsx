import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">Register</p>
          <CardTitle className="text-3xl">Buat akun operator baru</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Input placeholder="Nama lengkap" />
          <Input placeholder="Email" type="email" />
          <Input placeholder="Departemen" />
          <Input placeholder="Password" type="password" />
          <div className="md:col-span-2 flex items-center gap-3">
            <Button>Register</Button>
            <Link href="/login" className="text-sm text-muted-foreground">
              Sudah punya akun? Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
