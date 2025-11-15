'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  updateProfile,
} from 'firebase/auth';
import { useAuth, initiateEmailSignUp } from '@/firebase';
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
import { setDoc, doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileInput } from '@/components/ui/file-input';
import { uploadImage } from '@/utils/utils';
import { countries } from '@/lib/countries';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();


  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
        toast({ title: 'Error', description: 'Password must be at least 6 characters long.', variant: 'destructive' });
        return;
    }
    if (!country) {
        toast({ title: 'Error', description: 'Please select a country.', variant: 'destructive' });
        return;
    }
    if (!profilePicture) {
        toast({ title: 'Error', description: 'Please upload a profile picture.', variant: 'destructive' });
        return;
    }
    setIsLoading(true);
    try {
      const userCredential = await initiateEmailSignUp(auth, email, password);
      const user = userCredential.user;
      
      const photoURL = await uploadImage(profilePicture);

      await updateProfile(user, { displayName: username, photoURL });

      await setDoc(doc(firestore, "users", user.uid), {
        id: user.uid,
        uid: user.uid,
        fullName,
        username,
        email: user.email,
        photoURL,
        country,
        state,
        city,
        isAdmin: email === 'admin@example.com',
      });

      toast({ title: 'Success', description: 'Account created successfully.' });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Sign Up Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Logo className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-2xl">Create an Account</CardTitle>
        <CardDescription>Join the competition. Sign up to get started.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="John Doe"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading}
            />
          </div>
           <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="gamer123"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select onValueChange={setCountry} value={country} required>
                  <SelectTrigger id="country">
                      <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                      {countries.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                type="text"
                placeholder="California"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
           <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              type="text"
              placeholder="Los Angeles"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-picture">Profile Picture</Label>
            <FileInput
                id="profile-picture"
                required
                onChange={(e) => e.target.files && setProfilePicture(e.target.files[0])}
                disabled={isLoading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </form>

      </CardContent>
      <CardFooter className="justify-center text-sm">
        <p>
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Login
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
