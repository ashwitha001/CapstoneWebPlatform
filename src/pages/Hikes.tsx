import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Plus } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../main';
import Layout from '../components/Layout';
import { Skeleton } from '../components/ui/skeleton';
import { seedFirestore } from '../utils/seedFirestore';
import AddHikeModal from '../components/AddHikeModal';
import { useAuth } from '../context/AuthContext';

interface HikeProps {
  id: string;
  title: string;
  image: string;
  startDate: string;
  endDate: string;
  days: string[];
  times: string[];
  location: string;
  duration: string;
  difficulty: string;
  maxParticipants: number;
  currentParticipants?: number;
  description?: string;
  price?: number;
  status?: string;
  bookedGuests?: any[];
  assignedGuide?: string | null;
}

const HikeCard: React.FC<HikeProps> = ({
  id,
  title,
  image,
  startDate,
  times,
  location,
  duration,
  difficulty,
  maxParticipants,
  currentParticipants = 0,
}) => {
  // Convert any difficulty value to lowercase for consistent handling
  const normalizedDifficulty = difficulty.toLowerCase();
  
  // Map all difficulty levels to one of our display categories: easy, moderate, or hard
  let displayDifficulty: 'easy' | 'moderate' | 'hard';
  
  if (normalizedDifficulty === 'easy') {
    displayDifficulty = 'easy';
  } else if (normalizedDifficulty === 'moderate') {
    displayDifficulty = 'moderate';
  } else {
    // 'challenging', 'difficult', and 'hard' all map to 'hard'
    displayDifficulty = 'hard';
  }
  
  const difficultyClasses = {
    easy: 'bg-green-100 text-green-800',
    moderate: 'bg-yellow-100 text-amber-800',
    hard: 'bg-red-100 text-red-800',
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="relative">
        <img src={image} alt={title} className="w-full h-48 object-cover" />
        <div className="absolute top-4 right-4">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${difficultyClasses[displayDifficulty]}`}>
            {displayDifficulty}
          </span>
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-serif font-semibold mb-3">{title}</h3>
        <div className="space-y-2 text-gray-600 mb-4">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-nature-500" />
            <span>From: {new Date(startDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-nature-500" />
            <span>{times[0]}{times.length > 1 ? ` (+ ${times.length - 1} more times)` : ''}</span>
          </div>
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-nature-500" />
            <span>{location}</span>
          </div>
        </div>
        <div className="text-sm text-gray-500">Duration: {duration}</div>
        <div className="mt-2 text-sm">
          <span className="text-nature-600 font-medium">
            {maxParticipants - currentParticipants} spots left
          </span>
        </div>
      </div>
      <Link 
        to={`/hikes/${id}/book`}
        className="block w-full py-3 px-6 text-center bg-nature-500 hover:bg-nature-600 text-white transition-colors duration-200"
      >
        Book Now
      </Link>
    </div>
  );
};

const Hikes: React.FC = () => {
  const [hikes, setHikes] = useState<HikeProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const { user } = useAuth();

  const fetchHikes = async () => {
    try {
      console.log('Starting to fetch hikes...');
      setLoading(true);
      setError(null);
      
      console.log('Creating Firestore query...');
      const hikesQuery = query(
        collection(db, 'hikes'),
        orderBy('startDate', 'asc')
      );
      
      console.log('Executing Firestore query...');
      const querySnapshot = await getDocs(hikesQuery);
      console.log('Query executed successfully');
      
      if (!querySnapshot.empty) {
        console.log(`Found ${querySnapshot.docs.length} hikes`);
        const fetchedHikes = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as HikeProps[];
        
        console.log("Loaded hikes from Firestore:", fetchedHikes);
        setHikes(fetchedHikes);
      } else {
        console.log("No hikes found in Firestore, attempting to seed data...");
        try {
          await seedFirestore();
          console.log("Successfully seeded Firestore with initial data");
          
          // Fetch again after seeding
          console.log("Fetching seeded data...");
          const seededSnapshot = await getDocs(hikesQuery);
          const seededHikes = seededSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as HikeProps[];
          
          console.log(`Loaded ${seededHikes.length} seeded hikes`);
          setHikes(seededHikes);
        } catch (seedError) {
          console.error("Error seeding Firestore:", seedError);
          throw seedError;
        }
      }
    } catch (error) {
      console.error("Error loading hikes:", error);
      // More detailed error message
      const errorMessage = error instanceof Error 
        ? `Failed to load hikes: ${error.message}`
        : "Failed to load hikes. Please try again later.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchHikes();
  }, []);

  return (
    <Layout>
      {/* Header Section */}
      <div className="pt-24 bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-4xl md:text-5xl font-serif font-bold">Our Guided Hikes</h1>
            {user?.role === 'admin' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus size={20} />
                Add Hike
              </button>
            )}
          </div>
          <p className="text-lg text-gray-600 max-w-3xl">
            Join us on our guided hiking experiences. Book a hike below to secure your spot and
            prepare for an unforgettable adventure.
          </p>
        </div>
      </div>

      {/* Hikes Grid */}
      <div className="bg-white py-12">
        <div className="container mx-auto px-4">
          {error ? (
            <div className="text-center py-12">
              <p className="text-xl text-red-600">{error}</p>
              <p className="mt-2 text-gray-500">Please try refreshing the page.</p>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden shadow-lg">
                  <Skeleton className="w-full h-48" />
                  <div className="p-6 space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : hikes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {hikes.map((hike) => (
                <HikeCard key={hike.id} {...hike} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600">No upcoming hikes available at the moment.</p>
              <p className="mt-2 text-gray-500">Please check back later for new adventures!</p>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddHikeModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            fetchHikes();
          }}
        />
      )}
    </Layout>
  );
};

export default Hikes;
