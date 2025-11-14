'use client';

import type { Team, Tournament } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { deleteDoc, doc, setDoc, collection } from 'firebase/firestore';
import { Edit, Trash2, CalendarPlus } from 'lucide-react';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RegistrationsTable } from './registrations-table';

interface TournamentsTableProps {
    tournaments: Tournament[];
    teamsByTournament: Record<string, Team[]>;
}

export function TournamentsTable({ tournaments, teamsByTournament }: TournamentsTableProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleDelete = async (tournament: Tournament) => {
    if (!firestore) return;
    const tournamentRef = doc(firestore, 'tournaments', tournament.id);
    try {
        await deleteDoc(tournamentRef);
        toast({
          title: 'Tournament Deleted',
          description: `The tournament "${tournament.name}" has been deleted.`,
          variant: 'destructive',
        });
    } catch (error) {
        toast({
            title: 'Error Deleting Tournament',
            description: 'There was an issue deleting the tournament.',
            variant: 'destructive',
          });
        console.error("Error deleting tournament: ", error);
    }
  };

  const generateFixtures = async (tournament: Tournament, teams: Team[]) => {
    if (!firestore) {
      toast({ title: 'Error', description: 'Firestore not available.', variant: 'destructive'});
      return;
    }
    const approvedTeams = teams.filter(team => team.status === 'approved');
    if (approvedTeams.length < 2) {
      toast({ title: 'Not enough teams', description: 'At least two approved teams are needed to generate fixtures.', variant: 'destructive'});
      return;
    }

    const matches = [];
    for (let i = 0; i < approvedTeams.length - 1; i++) {
      for (let j = i + 1; j < approvedTeams.length; j++) {
        const matchId = doc(collection(firestore, 'dummy')).id; // Generate a unique ID
        matches.push({
          id: matchId,
          team1: { id: approvedTeams[i].id, name: approvedTeams[i].teamName },
          team2: { id: approvedTeams[j].id, name: approvedTeams[j].teamName },
          status: 'scheduled'
        });
      }
    }
    
    const fixtureId = `${tournament.id}_round_1`;
    const fixtureRef = doc(firestore, 'fixtures', fixtureId);
    
    try {
      await setDoc(fixtureRef, {
        id: fixtureId,
        tournamentId: tournament.id,
        round: 1,
        matches: matches
      });
      toast({ title: 'Fixtures Generated', description: `Fixtures for ${tournament.name} have been created.`});
    } catch(error) {
      console.error("Error generating fixtures: ", error);
      toast({ title: 'Error', description: 'Failed to generate fixtures.', variant: 'destructive'});
    }
  }

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const jsDate = date.toDate ? date.toDate() : new Date(date);
    return jsDate.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
  };

  if (tournaments.length === 0) {
    return (
        <div className="h-24 text-center flex items-center justify-center">
            No tournaments found.
        </div>
    )
  }

  return (
    <Accordion type="single" collapsible className="w-full">
        {tournaments.map((tournament) => {
            const teams = teamsByTournament[tournament.id] || [];
            return (
                <AccordionItem value={tournament.id} key={tournament.id}>
                    <AccordionTrigger>
                        <div className="flex justify-between items-center w-full pr-4">
                            <div className="text-left">
                                <p className="font-semibold text-base">{tournament.name}</p>
                                <p className="text-sm text-muted-foreground">{tournament.game} - {formatDate(tournament.date)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-muted-foreground">
                                    {teams.length} / {tournament.maxTeamLimit || 'N/A'} teams
                                </span>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="p-4 bg-muted/30 rounded-md">
                            <div className="flex justify-end gap-2 mb-4">
                                <Button size="sm" variant="outline" onClick={() => generateFixtures(tournament, teams)}>
                                    <CalendarPlus className="h-4 w-4 mr-1" /> Generate Fixtures
                                </Button>
                                <Button asChild size="sm" variant="outline">
                                    <Link href={`/admin/tournaments/edit/${tournament.id}`}>
                                    <Edit className="h-4 w-4 mr-1" /> Edit
                                    </Link>
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="destructive">
                                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                                    </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the tournament "{tournament.name}".
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(tournament)}>
                                        Yes, delete it
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                            <RegistrationsTable teams={teams} />
                        </div>
                    </AccordionContent>
                </AccordionItem>
            )
        })}
    </Accordion>
  );
}
