'use client';

import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { TournamentForm } from "@/components/tournament-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMustBeAdmin } from "@/hooks/use-auth";
import type { Tournament } from "@/lib/types";
import { doc } from "firebase/firestore";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function EditTournamentPage() {
    const { user, loading: userLoading } = useMustBeAdmin();
    const params = useParams();
    const id = params.id as string;
    const firestore = useFirestore();

    const tournamentRef = useMemoFirebase(
        () => (firestore && id ? doc(firestore, 'tournaments', id) : null),
        [firestore, id]
    );

    const { data: tournament, isLoading: tournamentLoading } = useDoc<Tournament>(tournamentRef);

    if (userLoading || tournamentLoading) {
        return <div className="container mx-auto px-4 py-8"><h1 className="text-3xl font-bold mb-4">Loading...</h1></div>;
    }

    if (!user) {
        // useMustBeAdmin will handle the redirect
        return null;
    }
    
    if (!tournament) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <div className="mb-4">
                <Button asChild variant="ghost">
                    <Link href="/admin">
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Back to Admin Dashboard
                    </Link>
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Edit Tournament</CardTitle>
                    <CardDescription>Update the details for "{tournament.name}".</CardDescription>
                </CardHeader>
                <CardContent>
                    <TournamentForm tournament={tournament} />
                </CardContent>
            </Card>
        </div>
    )
}
