'use client';

import type { Match } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, arrayRemove, arrayUnion, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';


interface FixtureCardProps {
    match: Match;
    fixtureId: string;
    isAdmin: boolean;
}

export function FixtureCard({ match, fixtureId, isAdmin }: FixtureCardProps) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [team1Score, setTeam1Score] = useState(match.team1Score?.toString() || '');
    const [team2Score, setTeam2Score] = useState(match.team2Score?.toString() || '');

    const handleSaveScore = async () => {
        if (!firestore) return;

        const score1 = parseInt(team1Score, 10);
        const score2 = parseInt(team2Score, 10);
        if (isNaN(score1) || isNaN(score2)) {
            toast({ title: "Invalid Score", description: "Scores must be numbers.", variant: "destructive"});
            return;
        }

        const winnerId = score1 > score2 ? match.team1.id : (score2 > score1 ? match.team2.id : undefined);

        const updatedMatch: Match = {
            ...match,
            team1Score: score1,
            team2Score: score2,
            winnerId: winnerId,
            status: 'completed'
        };

        const fixtureRef = doc(firestore, 'fixtures', fixtureId);

        try {
            // This is a bit complex: we need to remove the old match object and add the new one.
            // Firestore doesn't have a direct "update item in array" method.
            await updateDoc(fixtureRef, {
                matches: arrayRemove(match)
            });
            await updateDoc(fixtureRef, {
                matches: arrayUnion(updatedMatch)
            });

            toast({ title: "Score Updated", description: "The match score has been saved."});
        } catch (error) {
            console.error("Error updating score: ", error);
            toast({ title: "Error", description: "Failed to update match score.", variant: "destructive"});
        }
    };
    
    const isTeam1Winner = match.winnerId === match.team1.id;
    const isTeam2Winner = match.winnerId === match.team2.id;


    return (
        <Card>
            <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Team 1 */}
                <div className={cn("flex-1 text-center md:text-right font-semibold text-lg", isTeam1Winner && "text-primary")}>
                    {isTeam1Winner && <Trophy className="inline-block h-5 w-5 mr-2 text-yellow-400" />}
                    {match.team1.name}
                </div>

                {/* Score Area */}
                <div className="flex items-center gap-2">
                    {isAdmin ? (
                        <>
                            <Input 
                                type="number" 
                                className="w-16 h-10 text-center text-lg" 
                                value={team1Score} 
                                onChange={e => setTeam1Score(e.target.value)}
                                disabled={match.status === 'completed' && !isAdmin}
                            />
                            <span className="font-bold text-muted-foreground">vs</span>
                            <Input 
                                type="number" 
                                className="w-16 h-10 text-center text-lg" 
                                value={team2Score} 
                                onChange={e => setTeam2Score(e.target.value)}
                                disabled={match.status === 'completed' && !isAdmin}
                            />
                        </>
                    ) : (
                        <div className="flex items-center justify-center gap-2 font-bold text-2xl h-10">
                            <span>{match.team1Score ?? '-'}</span>
                            <span className="text-muted-foreground text-lg">vs</span>
                            <span>{match.team2Score ?? '-'}</span>
                        </div>
                    )}
                </div>

                 {/* Team 2 */}
                <div className={cn("flex-1 text-center md:text-left font-semibold text-lg", isTeam2Winner && "text-primary")}>
                    {match.team2.name}
                    {isTeam2Winner && <Trophy className="inline-block h-5 w-5 ml-2 text-yellow-400" />}
                </div>

                {/* Status/Actions */}
                <div className="w-full md:w-auto flex justify-center md:justify-end items-center gap-2">
                    {isAdmin ? (
                         <Button size="sm" onClick={handleSaveScore} disabled={match.status === 'completed'}>Save</Button>
                    ) : (
                        <Badge variant={match.status === 'completed' ? 'secondary' : 'outline'}>{match.status}</Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
