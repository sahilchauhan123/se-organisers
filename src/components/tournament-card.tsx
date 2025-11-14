import Link from 'next/link';
import Image from 'next/image';
import type { Tournament } from '@/lib/types';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Ticket, Share2, Users, CheckCircle2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

interface TournamentCardProps {
  tournament: Tournament;
  registeredTeams: number;
  isRegistered?: boolean;
}

export function TournamentCard({ tournament, registeredTeams, isRegistered }: TournamentCardProps) {
  const { toast } = useToast();
  const [tournamentUrl, setTournamentUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/tournaments/${tournament.id}`;
      setTournamentUrl(url);
    }
  }, [tournament.id]);

  const tournamentDate = tournament.date instanceof Timestamp 
    ? tournament.date.toDate() 
    : new Date(tournament.date as any);

  const currencySymbol = tournament.currency === 'INR' ? '₹' : '$';

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to the tournament page
    const shareData = {
      title: tournament.name,
      text: `Check out the "${tournament.name}" tournament on se-organizers!`,
      url: tournamentUrl,
    };
    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(tournamentUrl);
        toast({
          title: 'Link Copied!',
          description: 'The tournament link has been copied to your clipboard.',
        });
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        toast({
          title: 'Error',
          description: 'Could not copy link to clipboard.',
          variant: 'destructive',
        });
      }
    }
  };


  return (
    <Card className="flex flex-col overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1 bg-muted/20 border-border/50">
      <CardHeader className="p-0">
        <div className="relative h-40 w-full">
          <Image
            src={tournament.bannerUrl}
            alt={`${tournament.name} banner`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-contain"
            data-ai-hint="esports game"
          />
           <Button
            size="icon"
            variant="secondary"
            className="absolute top-2 right-2 h-8 w-8 bg-black/50 hover:bg-black/70 text-white"
            onClick={handleShare}
            aria-label="Share tournament"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          {isRegistered && (
            <Badge className="absolute top-2 left-2 bg-green-600 text-white border-none">
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                Registered
            </Badge>
          )}
        </div>
        <div className='p-6'>
          <Badge variant="secondary" className="mb-2 bg-accent/10 text-accent border-accent/20">{tournament.game}</Badge>
          <CardTitle className="text-xl leading-tight">{tournament.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="mr-2 h-4 w-4" />
          <span>{tournamentDate.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Ticket className="mr-2 h-4 w-4" />
          <span>
            Entry Fee: {tournament.entryFee > 0 ? `${currencySymbol}${tournament.entryFee}` : 'Free'}
          </span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="mr-2 h-4 w-4" />
          <span>
            {registeredTeams} / {tournament.maxTeamLimit} teams
          </span>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full bg-primary hover:bg-primary/90">
          <Link href={`/tournaments/${tournament.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

    