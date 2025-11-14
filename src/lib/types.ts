import { Timestamp } from "firebase/firestore";

export type UserProfile = {
  uid: string;
  email: string | null;
  fullName: string | null;
  username: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  photoURL: string | null;
  isAdmin: boolean;
};

export type Tournament = {
  id: string;
  name: string;
  game: string;
  description?: string;
  date: Date | Timestamp;
  entryFee: number;
  currency: 'USD' | 'INR';
  qrCodeUrl: string;
  bannerUrl: string;
  maxTeamLimit: number;
};

export type Team = {
  id: string;
  tournamentId: string;
  teamName: string;
  playerUsernames: string[];
  teamLeaderId: string;
  paymentScreenshotURL: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
};

export type Registration = {
    id: string;
    teamId: string;
    tournamentId: string;
    status: 'pending' | 'approved' | 'rejected';
}

export type Match = {
  id: string;
  team1: { id: string; name: string; };
  team2: { id: string; name: string; };
  team1Score?: number;
  team2Score?: number;
  winnerId?: string;
  status: 'scheduled' | 'completed';
}

export type Fixture = {
  id: string;
  tournamentId: string;
  matches: Match[];
  round: number;
}
