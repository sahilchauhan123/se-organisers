'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { UserProfile } from '@/lib/types';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

export const useAuth = () => {
  const { user: firebaseUser, isUserLoading, userError } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    if (isUserLoading) {
      setLoading(true);
      return;
    }
    if (userError || !firebaseUser) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const profileRef = doc(firestore, 'users', firebaseUser.uid);
    getDoc(profileRef).then(docSnap => {
        if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
        } else {
            // Create a basic profile if it doesn't exist (e.g. for Google sign-in)
            const newProfile: UserProfile = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                fullName: firebaseUser.displayName,
                username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Player',
                photoURL: firebaseUser.photoURL,
                country: 'N/A',
                state: 'N/A',
                city: 'N/A',
                isAdmin: firebaseUser.email === 'admin@example.com',
            };
            setDoc(profileRef, newProfile);
            setProfile(newProfile);
        }
        setLoading(false);
    }).catch(() => {
        setLoading(false);
    });

  }, [firebaseUser, isUserLoading, userError, firestore]);

  return { user: profile, loading };
};

export const useMustBeLoggedIn = () => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    return { user, loading };
}

export const useMustBeAdmin = () => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return; // Wait until loading is complete

        if (!user) {
            // If there's no user, redirect to login.
            router.push('/login');
        } else if (!user.isAdmin) {
            // If the user is not an admin, redirect to the regular dashboard.
            router.push('/dashboard');
        }
        // If the user is an admin, do nothing and let them stay on the page.
    }, [user, loading, router]);

    return { user, loading };
}
