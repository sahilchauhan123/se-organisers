'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserCredential,
} from 'firebase/auth';
import { useAuth as useFirebaseAuth, useFirestore, initiateEmailSignIn } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/icons';
import { doc, getDoc } from 'firebase/firestore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useFirebaseAuth();
  const firestore = useFirestore();

  const handleSuccessfulLogin = async (userCredential: UserCredential) => {
    const user = userCredential.user;
    if (!firestore) {
      router.push('/dashboard');
      toast({ title: 'Success', description: 'Logged in successfully.' });
      return;
    }
    const userDocRef = doc(firestore, 'users', user.uid);
    
    try {
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists() && docSnap.data().isAdmin) {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
      toast({ title: 'Success', description: 'Logged in successfully.' });
    } catch (error) {
      console.error("Error checking admin status:", error);
      // Default to dashboard if there's an error fetching the user document
      router.push('/dashboard');
      toast({ title: 'Success', description: 'Logged in successfully.' });
    }
  };


  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    initiateEmailSignIn(auth, email, password)
        .then(handleSuccessfulLogin)
        .catch((error: any) => {
            toast({
                title: 'Login Failed',
                description: error.message,
                variant: 'destructive',
            });
        })
        .finally(() => {
            setIsLoading(false);
        });
  };
  


  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Logo className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-2xl">Welcome Back</CardTitle>
        <CardDescription>Enter your credentials to access your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

      </CardContent>
      <CardFooter className="justify-center text-sm">
        <p>
          Don't have an account?{' '}
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
