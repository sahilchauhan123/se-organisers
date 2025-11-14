'use client';

import { TournamentForm } from "@/components/tournament-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMustBeAdmin } from "@/hooks/use-auth";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewTournamentPage() {
    const { user, loading } = useMustBeAdmin();

    if (loading || !user) {
        return <div className="container mx-auto px-4 py-8"><h1 className="text-3xl font-bold mb-4">Loading...</h1></div>;
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
                    <CardTitle>Create New Tournament</CardTitle>
                    <CardDescription>Fill out the details below to add a new tournament to the platform.</CardDescription>
                </CardHeader>
                <CardContent>
                    <TournamentForm />
                </CardContent>
            </Card>
        </div>
    )
}
