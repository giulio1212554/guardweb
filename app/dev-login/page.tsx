"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import Link from "next/link";

export default function DevLoginPage() {
  const router = useRouter();
  const loginAs = (role: string) => {
    document.cookie = `gw_dev_session=${role}; path=/; max-age=86400; SameSite=Lax`;
    router.push("/dashboard");
  };
  return (
    <div className="min-h-dvh bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
          <CardTitle>DEV Login</CardTitle>
          <CardDescription>Solo con NEXT_PUBLIC_DEV_MODE=true.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full" onClick={() => loginAs("pro-user")}>Entra come utente Pro</Button>
          <Button className="w-full" variant="secondary" onClick={() => loginAs("business-user")}>Entra come Business</Button>
          <Button className="w-full" variant="outline" onClick={() => loginAs("none-user")}>Entra senza piano</Button>
          <Button className="w-full" variant="destructive" onClick={() => loginAs("admin")}>Entra come Admin</Button>
          <p className="text-center text-sm text-muted-foreground pt-2">
            <Link href="/" className="underline">Torna alla home</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
