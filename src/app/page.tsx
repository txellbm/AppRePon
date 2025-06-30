"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { signInWithGoogle, signInAnonymouslyForDev } from '@/services/auth-service';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import Image from 'next/image';

const SHARED_LIST_ID = 'nuestra-despensa-compartida';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace(`/pantry/${SHARED_LIST_ID}`);
    }
  }, [user, loading, router]);

  const handleSignIn = async () => {
    setError(null);
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGuestLogin = async () => {
    setError(null);
    setIsSigningIn(true);
    try {
      await signInAnonymouslyForDev();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSigningIn(false);
    }
  };

  // While checking auth or if user exists and is being redirected, show a loader.
  if (loading || user) {
    return (
      <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <Image src="/logorepon.png" alt="Logo de RePon" width={180} height={45} priority />
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </main>
    );
  }

  // If not loading and no user, show the actual login page.
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center gap-6 text-center max-w-md mx-auto">
        <Image src="/logorepon.png" alt="Logo de RePon" width={240} height={60} priority />
        <div>
            <h1 className="text-2xl font-bold tracking-tight">Tu asistente de despensa inteligente</h1>
            <p className="text-muted-foreground mt-2">Inicia sesión para acceder a vuestra despensa compartida.</p>
        </div>

        {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md p-3 w-full max-w-xs flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <p className="text-left">{error}</p>
            </div>
        )}
        
        <div className="flex flex-col items-center gap-2 w-full">
          <Button onClick={handleSignIn} size="lg" className="w-full max-w-xs" disabled={isSigningIn}>
             {isSigningIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.2 172.9 60.3L337.9 162C300.9 128 258.1 108 210.3 108c-73.2 0-132.3 59.8-132.3 133.1s59.1 133.1 132.3 133.1c76.9 0 115.1-53.7 119.1-82.3H210.3v-71.6h278.2c2.9 15.6 4.6 33.1 4.6 52.5z"></path></svg>}
            Iniciar sesión con Google
          </Button>
          <Button onClick={handleGuestLogin} variant="link" className="text-muted-foreground h-auto p-1 text-xs" disabled={isSigningIn}>
            Continuar como invitado
          </Button>
        </div>
      </div>
    </main>
  );
}
