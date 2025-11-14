'use client';

import { useParams } from 'next/navigation';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, query, Timestamp, where } from 'firebase/firestore';
import type { Fixture, Team, Tournament } from '@/lib/types';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Calendar,
  Ticket,
  Gamepad2,
  Info,
  QrCode,
  Users,
  CheckCircle,
} from 'lucide-react';
import { TeamRegistrationForm } from '@/components/team-registration-form';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FixtureCard } from '@/components/fixture-card';
import { useAuth } from '@/hooks/use-auth';
import { useMemo } from 'react';
import Link from 'next/link';

export default function TournamentDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const firestore = useFirestore();
  const { user } = useAuth();

  // Safely create document reference for the tournament
  const tournamentRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'tournaments', id);
  }, [firestore, id]);
  const {
    data: tournament,
    isLoading: tournamentLoading,
    error: tournamentError,
  } = useDoc<Tournament>(tournamentRef);

  // Fetch all teams for this tournament
  const teamsQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return query(collection(firestore, 'teams'), where('tournamentId', '==', id));
  }, [firestore, id]);
  const { data: teams, isLoading: teamsLoading } = useCollection<Team>(teamsQuery);

  // Safely create document reference for the fixtures
  const fixtureRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    // Assuming a convention for fixture IDs, e.g., `${tournamentId}_round_1`
    return doc(firestore, 'fixtures', `${id}_round_1`);
  }, [firestore, id]);
  const {
    data: fixture,
    isLoading: fixtureLoading,
    error: fixtureError,
  } = useDoc<Fixture>(fixtureRef);

  const approvedTeamsCount = useMemo(() => teams?.filter(team => team.status === 'approved').length || 0, [teams]);
  const isRegistrationFull = tournament && approvedTeamsCount >= tournament.maxTeamLimit;

  const isAlreadyRegistered = useMemo(() => {
    if (!user || !teams) return false;
    return teams.some(team => team.teamLeaderId === user.uid);
  }, [user, teams]);

  // Show loading skeleton
  if (tournamentLoading || fixtureLoading || teamsLoading || !tournamentRef) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-64 md:h-96 bg-muted rounded-lg"></div>
          <div className="mt-8">
            <div className="h-8 bg-muted rounded w-3/4 mb-4"></div>
            <div className="h-6 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  // Handle Firestore errors or missing document safely
  if (tournamentError || !tournament) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold mb-2">Tournament Not Found</h2>
        <p className="text-muted-foreground">
          The tournament you are looking for doesn’t exist or may have been removed.
        </p>
      </div>
    );
  }

  // Convert Firestore Timestamp → JS Date
  const tournamentDate =
    tournament.date instanceof Timestamp
      ? tournament.date.toDate()
      : new Date(tournament.date as any);

  const currencySymbol = tournament.currency === 'INR' ? '₹' : '$';

  return (
    <>
      {/* Banner Image */}
      <div className="relative h-64 md:h-96 w-full">
        {tournament.bannerUrl ? (
          <Image
            src={tournament.bannerUrl}
            alt={`${tournament.name} banner`}
            fill
            priority
            className="object-contain"
          />
        ) : (
          <div className="h-full w-full bg-muted flex items-center justify-center text-muted-foreground">
            No Banner Available
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      {/* Main Section */}
      <div className="container -mt-16 md:-mt-24 pb-12">
        <div className="relative z-10">
          <div className="flex flex-col items-center text-center">
            <div className="flex-shrink-0">
              <Badge variant="secondary">{tournament.game}</Badge>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mt-2 text-center">
              {tournament.name}
            </h1>
            {tournament.description && (
                <p className="mt-4 max-w-3xl text-lg text-muted-foreground">
                    {tournament.description}
                </p>
            )}
          </div>
        </div>

        <div className="max-w-5xl mx-auto mt-8">
          <Tabs defaultValue="registration" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="registration">Register</TabsTrigger>
              <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
            </TabsList>
            <TabsContent value="registration">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-4">
                {/* Left: Registration Form */}
                <div className="md:col-span-2">
                  <Card>
                    <CardHeader className="text-left">
                      <CardTitle>Register Your Team</CardTitle>
                      <CardDescription>
                        Fill out the form below to enter the competition.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isAlreadyRegistered ? (
                          <div className="text-center p-8 border-2 border-dashed rounded-lg bg-muted/30">
                              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                              <h3 className="text-lg font-semibold mt-4">You are already registered!</h3>
                              <p className="text-muted-foreground mt-1">Your team is in. Check your dashboard for registration status.</p>
                              <Button asChild className="mt-4">
                                  <Link href="/dashboard">Go to Dashboard</Link>
                              </Button>
                          </div>
                      ) : isRegistrationFull ? (
                          <div className="text-center p-8 border-2 border-dashed rounded-lg bg-muted/30">
                              <h3 className="text-lg font-semibold text-destructive">Registrations Closed</h3>
                              <p className="text-muted-foreground mt-1">This tournament has reached its maximum team limit.</p>
                          </div>
                      ) : (
                          <TeamRegistrationForm tournamentId={tournament.id} />
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Right: Tournament Info */}
                <div className="md:col-span-1 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Tournament Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                      {/* Game */}
                      <div className="flex items-center">
                        <Gamepad2 className="mr-3 h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Game</p>
                          <p className="font-semibold">{tournament.game}</p>
                        </div>
                      </div>

                       {/* Teams */}
                       <div className="flex items-center">
                        <Users className="mr-3 h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Teams</p>
                          <p className="font-semibold">{approvedTeamsCount} / {tournament.maxTeamLimit}</p>
                        </div>
                      </div>

                      {/* Date */}
                      <div className="flex items-center">
                        <Calendar className="mr-3 h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Date & Time</p>
                          <p className="font-semibold">
                            {tournamentDate.toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Entry Fee */}
                      <div className="flex items-center">
                        <Ticket className="mr-3 h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Entry Fee</p>
                          <p className="font-semibold">
                            {tournament.entryFee > 0
                              ? `${currencySymbol}${tournament.entryFee}`
                              : 'Free'}
                          </p>
                        </div>
                      </div>

                      {/* Payment QR */}
                      {tournament.entryFee > 0 && tournament.qrCodeUrl && (
                        <div className="flex items-start">
                          <Info className="mr-3 mt-0.5 h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground">Payment</p>
                            <p className="font-semibold">
                              Scan the QR code to complete payment.
                            </p>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mt-2"
                                >
                                  <QrCode className="mr-2 h-4 w-4" /> Show QR
                                  Code
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Payment QR Code
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Scan this code with your payment app to pay
                                    the {currencySymbol}
                                    {tournament.entryFee} entry fee for "
                                    {tournament.name}".
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="relative aspect-square w-full max-w-xs mx-auto mt-4">
                                  <Image
                                    src={tournament.qrCodeUrl}
                                    alt="Payment QR code"
                                    fill
                                    className="object-contain"
                                  />
                                </div>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Close</AlertDialogCancel>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="fixtures">
              <Card>
                <CardHeader>
                  <CardTitle>Match Fixtures</CardTitle>
                  <CardDescription>
                    {fixture
                      ? `Showing matches for Round ${fixture.round}.`
                      : 'Fixtures have not been generated yet.'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {fixture && fixture.matches.length > 0 ? (
                    <div className="space-y-4">
                      {fixture.matches.map((match) => (
                        <FixtureCard
                          key={match.id}
                          match={match}
                          fixtureId={fixture.id}
                          isAdmin={user?.isAdmin || false}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <p>No matches to display.</p>
                      {user?.isAdmin && (
                        <p className="mt-2 text-sm">
                          You can generate fixtures from the admin dashboard.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
