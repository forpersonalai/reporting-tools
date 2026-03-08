import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Konfigurasi integrasi AI, API key, webhook, dan preferensi dashboard ditempatkan di sini.
      </CardContent>
    </Card>
  );
}
