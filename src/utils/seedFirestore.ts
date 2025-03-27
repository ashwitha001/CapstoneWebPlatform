import { collection, addDoc, getDocs, query } from 'firebase/firestore';
import { db } from '../main';

const demoHikes = [
  {
    title: 'Banff Sulphur Mountain Trail',
    image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&q=80&w=1974',
    startDate: '2024-06-15',
    endDate: '2024-08-31',
    days: ['Monday', 'Wednesday', 'Friday'],
    times: ['08:00'],
    location: 'Banff National Park, AB',
    duration: '3-4 hours',
    difficulty: 'Moderate',
    maxParticipants: 15,
    currentParticipants: 0,
    description: 'Enjoy a scenic mountain hike with gondola access and stunning valley views.',
    price: 75,
    status: 'upcoming',
    bookedGuests: [],
    assignedGuide: null
  },
  {
    title: 'Bruce Trail Experience',
    image: 'https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?auto=format&fit=crop&q=80&w=1974',
    startDate: '2024-06-22',
    endDate: '2024-09-15',
    days: ['Tuesday', 'Thursday', 'Saturday'],
    times: ['09:00'],
    location: 'Niagara Region, ON',
    duration: '2-3 hours',
    difficulty: 'Easy',
    maxParticipants: 20,
    currentParticipants: 0,
    description: 'Experience Canada\'s oldest and longest marked hiking trail.',
    price: 45,
    status: 'upcoming',
    bookedGuests: [],
    assignedGuide: null
  },
  {
    title: 'Garibaldi Lake Trek',
    image: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&q=80&w=1974',
    startDate: '2024-07-05',
    endDate: '2024-08-31',
    days: ['Friday', 'Saturday', 'Sunday'],
    times: ['07:00'],
    location: 'Garibaldi Provincial Park, BC',
    duration: '6-7 hours',
    difficulty: 'Challenging',
    maxParticipants: 10,
    currentParticipants: 0,
    description: 'Challenge yourself with this breathtaking alpine lake hike.',
    price: 95,
    status: 'upcoming',
    bookedGuests: [],
    assignedGuide: null
  },
];

export const seedFirestore = async () => {
  try {
    // Check if data already exists
    const hikesCollection = collection(db, 'hikes');
    const existingHikes = await getDocs(query(hikesCollection));
    
    if (!existingHikes.empty) {
      console.log('Data already exists in Firestore. Skipping seeding.');
      return;
    }
    
    // Seed data only if collection is empty
    const seedPromises = demoHikes.map(hike => addDoc(hikesCollection, hike));
    await Promise.all(seedPromises);
    
    console.log('Successfully seeded Firestore with demo hikes!');
  } catch (error) {
    console.error('Error seeding Firestore:', error);
    throw error;
  }
}; 