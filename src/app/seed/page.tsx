'use client';

import { useEffect, useState } from 'react';
import { useFirestore } from '@/firebase';
import { seedDatabase } from '@/lib/seed';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Loader2 } from 'lucide-react';

export default function SeedPage() {
  const firestore = useFirestore();
  const [loading, setLoading] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSeed = async () => {
    setLoading(true);
    setError(null);
    setSeeded(false);
    try {
      if (!firestore) {
        throw new Error('Firestore is not initialized.');
      }
      await seedDatabase(firestore);
      setSeeded(true);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'An unknown error occurred while seeding.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Seed Database</CardTitle>
          <CardDescription>
            Click the button below to populate your Firestore database with initial
            sample data for tournaments. This is only needed once.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-4">
          <Button onClick={handleSeed} disabled={loading || seeded} className="w-full">
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Seeding...</>
            ) : seeded ? (
              <><Check className="mr-2 h-4 w-4" /> Seeded Successfully!</>
            ) : (
              'Seed Tournaments'
            )}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
           {seeded && (
            <p className="text-sm text-muted-foreground pt-4 text-center">
                You can now return to the <a href="/" className="text-primary underline">homepage</a> to see the tournaments.
            </p>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
