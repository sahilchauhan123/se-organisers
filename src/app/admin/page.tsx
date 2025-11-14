'use client';

import { useMustBeAdmin } from '@/hooks/use-auth';
import { RegistrationsTable } from '@/components/registrations-table';
import { TournamentsTable } from '@/components/tournaments-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, OrderByDirection } from 'firebase/firestore';
import type { Team, Tournament } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

type TournamentSortField = 'date' | 'name';
type RegistrationSortField = 'teamName' | 'tournamentName';


export default function AdminPage() {
  const { user, loading } = useMustBeAdmin();
  const firestore = useFirestore();
  
  // State for tournaments sorting
  const [tournamentSortField, setTournamentSortField] = useState<TournamentSortField>('date');
  const [tournamentSortDirection, setTournamentSortDirection] = useState<OrderByDirection>('desc');
  const [tournamentSearch, setTournamentSearch] = useState('');
  const debouncedTournamentSearch = useDebounce(tournamentSearch, 300);
  
  // State for registrations sorting
  const [registrationSortField, setRegistrationSortField] = useState<RegistrationSortField>('teamName');
  const [registrationSortDirection, setRegistrationSortDirection] = useState<'asc' | 'desc'>('asc');

  const pendingTeamsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, "teams"), where("status", "==", "pending")) : null),
    [firestore]
  );
  const { data: pendingTeams, isLoading: pendingTeamsLoading } = useCollection<Team>(pendingTeamsQuery);

  const allTeamsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "teams") : null),
    [firestore]
  );
  const { data: allTeams, isLoading: allTeamsLoading } = useCollection<Team>(allTeamsQuery);
  
  const allTournamentsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'tournaments') : null),
    [firestore]
  );
  const { data: allTournaments, isLoading: allTournamentsLoading } = useCollection<Tournament>(allTournamentsQuery);


  const tournamentsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'tournaments'), orderBy(tournamentSortField, tournamentSortDirection)) : null),
    [firestore, tournamentSortField, tournamentSortDirection]
  );
  const { data: tournaments, isLoading: tournamentsLoading } = useCollection<Tournament>(tournamentsQuery);
  
  const tournamentsMap = useMemo(() => {
    if (!allTournaments) return {};
    return allTournaments.reduce((acc, t) => {
      acc[t.id] = t;
      return acc;
    }, {} as Record<string, Tournament>);
  }, [allTournaments]);

  const sortedPendingTeams = useMemo(() => {
    if (!pendingTeams) return [];
    return [...pendingTeams].sort((a, b) => {
      let valA: string | number;
      let valB: string | number;

      if (registrationSortField === 'teamName') {
        valA = a.teamName.toLowerCase();
        valB = b.teamName.toLowerCase();
      } else { // tournamentName
        valA = tournamentsMap[a.tournamentId]?.name.toLowerCase() || '';
        valB = tournamentsMap[b.tournamentId]?.name.toLowerCase() || '';
      }

      if (valA < valB) return registrationSortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return registrationSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [pendingTeams, registrationSortField, registrationSortDirection, tournamentsMap]);

  const filteredTournaments = useMemo(() => {
    if (!tournaments) return [];
    if (!debouncedTournamentSearch) return tournaments;
    return tournaments.filter(t => t.name.toLowerCase().includes(debouncedTournamentSearch.toLowerCase()));
  }, [tournaments, debouncedTournamentSearch]);

  const handleTournamentSortChange = (value: string) => {
    const [field, direction] = value.split('_');
    setTournamentSortField(field as TournamentSortField);
    setTournamentSortDirection(direction as OrderByDirection);
  };

  const handleRegistrationSortChange = (value: string) => {
    const [field, direction] = value.split('_');
    setRegistrationSortField(field as RegistrationSortField);
    setRegistrationSortDirection(direction as 'asc' | 'desc');
  }

  if (loading || !user) {
    return <div className="container mx-auto px-4 py-8"><h1 className="text-3xl font-bold mb-4">Loading Admin Panel...</h1></div>;
  }

  const teamsByTournament = allTeams?.reduce((acc, team) => {
    (acc[team.tournamentId] = acc[team.tournamentId] || []).push(team);
    return acc;
  }, {} as Record<string, Team[]>);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
              <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
              <p className="mt-2 text-lg text-muted-foreground">
              Manage tournament registrations and site content.
              </p>
          </div>
          <Button asChild>
              <Link href="/admin/tournaments/new">Create New Tournament</Link>
          </Button>
        </header>

        <Tabs defaultValue="registrations">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="registrations">Pending Registrations</TabsTrigger>
              <TabsTrigger value="tournaments">Manage Tournaments</TabsTrigger>
          </TabsList>
          <TabsContent value="registrations">
              <Card>
                  <CardHeader>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                              <CardTitle>Pending Registrations</CardTitle>
                              <CardDescription>Review and approve or reject new team registrations.</CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                              <Label htmlFor="sort-registrations">Sort by</Label>
                              <Select onValueChange={handleRegistrationSortChange} defaultValue={`${registrationSortField}_${registrationSortDirection}`}>
                                  <SelectTrigger id="sort-registrations" className="w-[220px]">
                                      <SelectValue placeholder="Sort by" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="teamName_asc">Team Name: A-Z</SelectItem>
                                      <SelectItem value="teamName_desc">Team Name: Z-A</SelectItem>
                                      <SelectItem value="tournamentName_asc">Tournament Name: A-Z</SelectItem>
                                      <SelectItem value="tournamentName_desc">Tournament Name: Z-A</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>
                      </div>
                  </CardHeader>
                  <CardContent>
                      {pendingTeamsLoading || allTournamentsLoading ? (
                          <p>Loading registrations...</p>
                      ) : (
                          <RegistrationsTable teams={sortedPendingTeams || []} showTournamentName={true} />
                      )}
                  </CardContent>
              </Card>
          </TabsContent>
          <TabsContent value="tournaments">
              <Card>
                  <CardHeader>
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                          <div className="flex-1">
                              <CardTitle>All Tournaments</CardTitle>
                              <CardDescription>View, edit, or delete existing tournaments and see registered teams.</CardDescription>
                          </div>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
                              <div className="relative w-full sm:w-auto">
                                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <Input
                                      type="search"
                                      placeholder="Search tournaments..."
                                      className="pl-8 sm:w-[200px] lg:w-[250px]"
                                      value={tournamentSearch}
                                      onChange={(e) => setTournamentSearch(e.target.value)}
                                  />
                              </div>
                              <div className="flex items-center gap-2">
                                  <Label htmlFor="sort-tournaments" className="hidden sm:block">Sort by</Label>
                                  <Select onValueChange={handleTournamentSortChange} defaultValue={`${tournamentSortField}_${tournamentSortDirection}`}>
                                      <SelectTrigger id="sort-tournaments" className="w-full sm:w-[180px]">
                                          <SelectValue placeholder="Sort by" />
                                      </SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="date_desc">Date: Newest</SelectItem>
                                          <SelectItem value="date_asc">Date: Oldest</SelectItem>
                                          <SelectItem value="name_asc">Name: A-Z</SelectItem>
                                          <SelectItem value="name_desc">Name: Z-A</SelectItem>
                                      </SelectContent>
                                  </Select>
                              </div>
                          </div>
                      </div>
                  </CardHeader>
                  <CardContent>
                      {tournamentsLoading || allTeamsLoading ? (
                          <p>Loading tournaments...</p>
                      ) : (
                          <TournamentsTable tournaments={filteredTournaments || []} teamsByTournament={teamsByTournament || {}} />
                      )}
                  </CardContent>
              </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
