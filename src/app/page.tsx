'use client';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { LayoutDashboard, Swords } from 'lucide-react';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Team, Tournament } from '@/lib/types';
import { collection, query, orderBy } from 'firebase/firestore';
import { TournamentCard } from '@/components/tournament-card';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function Home() {
  const { user, loading } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const footballHeroImage = PlaceHolderImages.find(p => p.id === 'football-hero');

  const tournamentsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'tournaments'), orderBy('date', 'desc')) : null),
    [firestore]
  );
  const { data: tournaments, isLoading: tournamentsLoading } = useCollection<Tournament>(tournamentsQuery);

  const teamsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'teams') : null),
    [firestore]
  );
  const { data: allTeams, isLoading: teamsLoading } = useCollection<Team>(teamsQuery);
  
  const teamsByTournament = useMemo(() => {
    if (!allTeams) return {};
    return allTeams.reduce((acc, team) => {
      if (team.status === 'approved') {
        acc[team.tournamentId] = (acc[team.tournamentId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
  }, [allTeams]);

  const registeredTournamentIds = useMemo(() => {
    if (!user || !allTeams) return new Set();
    return new Set(allTeams.filter(team => team.teamLeaderId === user.uid).map(team => team.tournamentId));
  }, [user, allTeams]);


  useEffect(() => {
    if (loading || !user) {
      return;
    }

    if (user.isAdmin) {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  }, [user, loading, router]);


  if (loading || user) {
    return (
        <div className="flex h-screen items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
    );
  }

  return (
    <div className="relative isolate overflow-hidden bg-background">
      <div className="relative h-[60vh] min-h-[500px] w-full">
         {footballHeroImage && (
            <Image
                src={footballHeroImage.imageUrl}
                alt="A football on a pristine stadium pitch"
                fill
                priority
                className="object-cover"
                data-ai-hint={footballHeroImage.imageHint}
            />
         )}
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="absolute inset-0 flex items-center justify-center px-4">
            <div className="mx-auto max-w-2xl text-center">
                <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
                    Your Virtual Pitch Awaits
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                    Discover, join, and conquer online football esports tournaments. Your journey to glory starts here.
                </p>
                <div className="mt-10 flex flex-col items-center justify-center gap-y-4 sm:flex-row sm:gap-x-6">
                    <Button asChild size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                        <Link href="/tournaments">
                            Browse Matches <Swords className="ml-2" />
                        </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="w-full sm:w-auto text-white border-white hover:bg-white/10">
                        <Link href={user ? "/dashboard" : "/login"}>
                        Your Dashboard <LayoutDashboard className="ml-2" />
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
          <header className="mb-8 text-center">
              <h2 className="text-3xl font-bold tracking-tight">
              Latest Tournaments
              </h2>
              <p className="mt-2 text-lg text-muted-foreground">
              Check out the newest competitions heating up the scene.
              </p>
          </header>

          {tournamentsLoading || teamsLoading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {[...Array(4)].map((_, i) => (
                      <div key={i} className="animate-pulse rounded-lg border bg-card/50 p-6">
                          <div className="h-40 bg-muted/50 rounded-md mb-4"></div>
                          <div className="h-6 bg-muted/50 rounded w-3/4 mb-2"></div>
                          <div className="h-4 bg-muted/50 rounded w-1/2"></div>
                      </div>
                  ))}
              </div>
          ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {tournaments?.map((tournament: Tournament) => (
                  <TournamentCard 
                    key={tournament.id} 
                    tournament={tournament}
                    registeredTeams={teamsByTournament[tournament.id] || 0}
                    isRegistered={registeredTournamentIds.has(tournament.id)}
                  />
                  ))}
              </div>
          )}
      </div>
    </div>
  );
}
