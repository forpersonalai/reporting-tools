import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UsersPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Manajemen user</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Halaman admin untuk manajemen user dan role. Endpoint public API `/api/v1/users` sudah disiapkan sebagai baseline.
      </CardContent>
    </Card>
  );
}
