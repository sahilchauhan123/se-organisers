import { initializeFirebase } from "@/firebase/config";
import type { Tournament } from "./types";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { getApps, initializeApp } from "firebase/app";

// Helper to initialize a temporary admin-like app instance
// This is necessary because generateMetadata runs on the server and might not have the 
// client-side firebase initialized.
const getDb = () => {
    if (getApps().length === 0) {
        initializeApp(initializeFirebase());
    }
    return getFirestore();
}

export async function generateMetadata({ params }: { params: { id: string } }) {
    const db = getDb();
    const tournamentRef = doc(db, 'tournaments', params.id);
    const tournamentSnap = await getDoc(tournamentRef);
  
    if (!tournamentSnap.exists()) {
      return {
        title: 'Tournament Not Found',
        description: 'This tournament does not exist.',
      }
    }
  
    const tournament = tournamentSnap.data() as Tournament;
  
    return {
      title: `${tournament.name} | se-organizers`,
      description: `Join the ${tournament.name} tournament on se-organizers. Game: ${tournament.game}.`,
      openGraph: {
        title: tournament.name,
        description: `Join the competition for ${tournament.game}!`,
        images: [
          {
            url: tournament.bannerUrl,
            width: 1200,
            height: 630,
            alt: tournament.name,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: tournament.name,
        description: `Join the competition for ${tournament.game}!`,
        images: [tournament.bannerUrl],
      }
    }
  }
  
  

    