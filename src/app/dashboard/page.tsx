'use client';

import { useMustBeLoggedIn } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Hash, MessageSquareX } from 'lucide-react';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Team, Tournament } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

export default function DashboardPage() {
  const { user, loading } = useMustBeLoggedIn();
  const firestore = useFirestore();

  const teamsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'teams'), where('teamLeaderId', '==', user.uid));
  }, [user, firestore]);

  const { data: userTeams, isLoading: teamsLoading } = useCollection<Team>(teamsQuery);
  
  const tournamentsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'tournaments') : null),
    [firestore]
  );

  const { data: allTournaments, isLoading: tournamentsLoading } = useCollection<Tournament>(tournamentsQuery);

  const getStatusClasses = (status: 'pending' | 'approved' | 'rejected') => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-300';
    }
  };

  const getTournamentName = (tournamentId: string) => {
    return allTournaments?.find(t => t.id === tournamentId)?.name || 'Tournament';
  };

  if (loading || !user || teamsLoading || tournamentsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Loading Dashboard...</h1>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome, {user.username}
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Here are your tournament registrations.
        </p>
      </header>

      {userTeams && userTeams.length > 0 ? (
        <div className="space-y-6">
          {userTeams.map((team) => (
            <Card key={team.id} className="overflow-hidden">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 bg-muted/30">
                <div>
                  <CardDescription>Tournament</CardDescription>
                  <CardTitle className="text-xl">
                    <Link href={`/tournaments/${team.tournamentId}`} className="hover:underline">
                      {getTournamentName(team.tournamentId)}
                    </Link>
                  </CardTitle>
                </div>
                <Badge
                  className={cn('capitalize', getStatusClasses(team.status))}
                >
                  {team.status}
                </Badge>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Hash className="mr-3 h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Team Name</p>
                      <p className="font-semibold">{team.teamName}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              {team.status === 'rejected' && team.rejectionReason && (
                <CardFooter>
                    <Alert variant="destructive" className="w-full">
                        <MessageSquareX className="h-4 w-4" />
                        <AlertTitle>Rejection Reason</AlertTitle>
                        <AlertDescription>
                            {team.rejectionReason}
                        </AlertDescription>
                    </Alert>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold">No Registrations Found</h2>
          <p className="mt-2 text-muted-foreground">
            You haven't registered for any tournaments yet.
          </p>
          <Button asChild className="mt-4">
            <Link href="/">Browse Tournaments</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
