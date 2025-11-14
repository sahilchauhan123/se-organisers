'use client';
import { TournamentCard } from '@/components/tournament-card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { Team, Tournament } from '@/lib/types';
import { collection } from 'firebase/firestore';
import { useMemo } from 'react';

export default function TournamentsPage() {
  const firestore = useFirestore();
  const { user } = useAuth();
  
  const tournamentsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'tournaments') : null),
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


  if (tournamentsLoading || teamsLoading) {
    return (
        <div className="container mx-auto px-4 py-8">
            <header className="mb-8 text-center">
                <h1 className="text-4xl font-bold tracking-tight text-primary md:text-5xl">
                Active Tournaments
                </h1>
                <p className="mt-2 text-lg text-muted-foreground">
                Loading competitions...
                </p>
            </header>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse rounded-lg border bg-card p-6">
                        <div className="h-40 bg-muted rounded-md mb-4"></div>
                        <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                    </div>
                ))}
            </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary md:text-5xl">
          Active Tournaments
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Browse and join the latest competitions.
        </p>
      </header>
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
    </div>
  );
}
