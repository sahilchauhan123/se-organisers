'use server';

import { collection, writeBatch, Firestore, Timestamp, getDocs } from 'firebase/firestore';
import { PlaceHolderImages } from './placeholder-images';

// Helper to get a placeholder image URL by its ID
const getImageUrl = (id: string) => {
    const image = PlaceHolderImages.find(p => p.id === id);
    if (!image) {
        console.warn(`Placeholder image with id "${id}" not found.`);
        return "https://placehold.co/600x400?text=Image+Not+Found";
    }
    return image.imageUrl;
}

const getQrUrl = () => getImageUrl('generic-qr');


const tournamentsToSeed = [
  {
    name: 'Valorant Champions Tour: Stage 2 Masters',
    game: 'Valorant',
    description: 'The world\'s best Valorant teams face off in an epic showdown for the title of Masters champion. Expect high-stakes action, incredible clutches, and unforgettable moments.',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // One week from now
    entryFee: 50,
    currency: 'USD',
    bannerUrl: getImageUrl('valorant-banner'),
  },
  {
    name: 'Call of Duty League Major IV',
    game: 'Call of Duty',
    description: 'The Call of Duty League heats up with Major IV. Teams will battle for crucial league points and a massive prize pool. Don\'t miss the intense, fast-paced combat.',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Two weeks from now
    entryFee: 100,
    currency: 'USD',
    bannerUrl: getImageUrl('cod-banner'),
  },
  {
    name: 'League of Legends Mid-Season Invitational',
    game: 'League of Legends',
    description: 'Regional champions from around the globe gather to prove their strength at the Mid-Season Invitational. Witness strategic masterclasses and mechanical outplays on the Summoner\'s Rift.',
    date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // Three weeks from now
    entryFee: 75,
    currency: 'USD',
    bannerUrl: getImageUrl('league-banner'),
  },
  {
    name: 'Community FIFA 2025 Kick-off',
    game: 'FIFA 2025',
    description: 'Our annual community FIFA tournament is back! Whether you\'re a seasoned pro or a casual player, join us for a fun-filled competition and a chance to be crowned the community champion.',
    date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // Four weeks from now
    entryFee: 2500,
    currency: 'INR',
    bannerUrl: 'https://picsum.photos/seed/fifa/600/400',
  },
];

export async function seedDatabase(db: Firestore) {
  console.log('Starting to seed database...');
  const tournamentsCollection = collection(db, 'tournaments');

  // Check if tournaments already exist to prevent re-seeding
  const existingTournaments = await getDocs(tournamentsCollection);
  if (!existingTournaments.empty) {
    console.log('Tournaments collection is not empty. Skipping seed.');
    return;
  }

  const batch = writeBatch(db);

  tournamentsToSeed.forEach((tournament) => {
    const docRef = collection(db, 'tournaments').doc();
    batch.set(docRef, {
      ...tournament,
      date: Timestamp.fromDate(tournament.date),
      qrCodeUrl: getQrUrl(), // Add the generic QR code to every tournament
    });
  });

  try {
    await batch.commit();
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw new Error('Failed to seed database.');
  }
}
