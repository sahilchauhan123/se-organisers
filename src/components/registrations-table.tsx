'use client';

import type { Team, Tournament, UserProfile } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Eye } from 'lucide-react';
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
  } from "@/components/ui/alert-dialog"
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { useState } from 'react';

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

function RegistrationRow({ team, showTournamentName }: { team: Team, showTournamentName: boolean }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [rejectionReason, setRejectionReason] = useState('');
    
    const tournamentRef = useMemoFirebase(
      () => (firestore ? doc(firestore, 'tournaments', team.tournamentId) : null),
      [firestore, team.tournamentId]
    );
    const { data: tournament, isLoading: tournamentLoading } = useDoc<Tournament>(tournamentRef);

    const teamLeaderRef = useMemoFirebase(
        () => (firestore ? doc(firestore, 'users', team.teamLeaderId) : null),
        [firestore, team.teamLeaderId]
    );
    const { data: teamLeader, isLoading: teamLeaderLoading } = useDoc<UserProfile>(teamLeaderRef);

    const handleUpdateStatus = async (newStatus: 'approved' | 'rejected', reason?: string) => {
        if (!firestore) return;
    
        const teamDocRef = doc(firestore, 'teams', team.id);
        const registrationsQuery = query(collection(firestore, 'registrations'), where('teamId', '==', team.id));

        try {
            const batch = writeBatch(firestore);

            const updateData: { status: 'approved' | 'rejected', rejectionReason?: string } = { status: newStatus };
            if (newStatus === 'rejected' && reason) {
              updateData.rejectionReason = reason;
            }

            // Update the team status
            batch.update(teamDocRef, updateData);
    
            // Find and update the corresponding registration document(s)
            const registrationSnapshot = await getDocs(registrationsQuery);
            registrationSnapshot.forEach(registrationDoc => {
                batch.update(registrationDoc.ref, { status: newStatus });
            });

            await batch.commit();
    
            if (newStatus === 'approved') {
                toast({ title: 'Success', description: `Team ${team.teamName} has been approved.` });
            } else {
                toast({ title: 'Team Rejected', description: `Team ${team.teamName} has been rejected.`, variant: 'destructive' });
            }
        } catch (error) {
            console.error("Error updating status: ", error);
            toast({ title: 'Error', description: 'Failed to update registration status.', variant: 'destructive' });
        }
    };

    if (tournamentLoading || teamLeaderLoading) {
        return <TableRow><TableCell colSpan={6}>Loading data...</TableCell></TableRow>;
    }

    return (
        <TableRow key={team.id}>
            <TableCell className="font-medium">{team.teamName}</TableCell>
            {showTournamentName && <TableCell>{tournament?.name || 'Loading...'}</TableCell>}
            <TableCell className="hidden md:table-cell">
                <Badge variant="secondary">{teamLeader?.username || team.playerUsernames[0]}</Badge>
            </TableCell>
            <TableCell className="text-center">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Eye className="h-4 w-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-4xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Payment Screenshot</AlertDialogTitle>
                            <AlertDialogDescription>
                                For team: {team.teamName}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="relative aspect-video w-full mt-4">
                            <Image src={team.paymentScreenshotURL} alt="Payment screenshot" layout="fill" objectFit='contain' />
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Close</AlertDialogCancel>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </TableCell>
            <TableCell>
                 <Badge className={cn("capitalize hidden sm:inline-flex", getStatusClasses(team.status))}>
                  {team.status}
                </Badge>
            </TableCell>
            <TableCell>
                <div className='flex flex-col sm:flex-row sm:justify-end gap-2'>
                    {team.status === 'pending' && (
                        <>
                            <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700" onClick={() => handleUpdateStatus('approved')}>
                            <Check className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700">
                                        <X className="h-4 w-4 mr-1" /> Reject
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Reject Registration</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Please provide a reason for rejecting the registration for "{team.teamName}". This will be shown to the team leader.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="rejection-reason">Reason for Rejection</Label>
                                            <Textarea 
                                                id="rejection-reason"
                                                placeholder="e.g., Incomplete player information, payment issue, etc." 
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleUpdateStatus('rejected', rejectionReason)} disabled={!rejectionReason}>
                                            Confirm Rejection
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </>
                    )}
                </div>
            </TableCell>
        </TableRow>
    );
}


export function RegistrationsTable({ teams, showTournamentName = false }: { teams: Team[], showTournamentName?: boolean }) {
  
  if (!teams) {
    return <p>Loading registrations...</p>
  }
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Team Name</TableHead>
            {showTournamentName && <TableHead>Tournament</TableHead>}
            <TableHead className="hidden md:table-cell">Team Admin</TableHead>
            <TableHead className="text-center">Payment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.length > 0 ? (
            teams.map((team) => (
              <RegistrationRow key={team.id} team={team} showTournamentName={showTournamentName} />
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={showTournamentName ? 6 : 5} className="h-24 text-center">
                No registrations found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
