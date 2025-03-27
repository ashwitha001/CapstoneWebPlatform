import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin } from 'lucide-react';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../main';

interface Hike {
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
  currentParticipants: number;
  description: string;
  price: number;
}

const HikeDetail: React.FC = () => {
  const { hikeId } = useParams<{ hikeId: string }>();
  const [hike, setHike] = useState<Hike | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchHikeDetails = async () => {
      if (!hikeId) {
        navigate('/404');
        return;
      }

      try {
        setLoading(true);
        const hikeDoc = await getDoc(doc(db, 'hikes', hikeId));
        
        if (hikeDoc.exists()) {
          setHike({
            id: hikeDoc.id,
            ...hikeDoc.data()
          } as Hike);
        } else {
          navigate('/404');
        }
      } catch (error) {
        console.error('Error fetching hike details:', error);
        navigate('/404');
      } finally {
        setLoading(false);
      }
    };

    fetchHikeDetails();
  }, [hikeId, navigate]);

  // Map normalized difficulty to display class
  const getDifficultyClass = (difficulty: string) => {
    const normalizedDifficulty = difficulty.toLowerCase();
    
    if (normalizedDifficulty === 'easy') {
      return 'bg-green-100 text-green-800';
    } else if (normalizedDifficulty === 'moderate') {
      return 'bg-yellow-100 text-amber-800';
    } else {
      // 'challenging', 'difficult', and 'hard' all map to 'hard'
      return 'bg-red-100 text-red-800';
    }
  };

  // Get normalized display difficulty
  const getDisplayDifficulty = (difficulty: string) => {
    const normalizedDifficulty = difficulty.toLowerCase();
    
    if (normalizedDifficulty === 'easy') {
      return 'easy';
    } else if (normalizedDifficulty === 'moderate') {
      return 'moderate';
    } else {
      return 'hard';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 min-h-[50vh] flex items-center justify-center">
          <p className="text-lg text-gray-600">Loading hike details...</p>
        </div>
      </Layout>
    );
  }

  if (!hike) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 min-h-[50vh] flex items-center justify-center">
          <p className="text-lg text-gray-600">Hike not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="pt-24 bg-white">
        <div className="relative">
          <div className="w-full h-[50vh] overflow-hidden">
            <img
              src={hike.image}
              alt={hike.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute top-4 right-4">
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${getDifficultyClass(hike.difficulty)}`}>
              {getDisplayDifficulty(hike.difficulty)}
            </span>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">{hike.title}</h1>
            
            <div className="flex flex-col md:flex-row gap-6 mb-8">
              <div className="flex-1 space-y-4">
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-5 w-5 mr-2 text-nature-500" />
                  <span>Available from {new Date(hike.startDate).toLocaleDateString()} to {new Date(hike.endDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="h-5 w-5 mr-2 text-nature-500" />
                  <span>
                    {hike.days.join(', ')} at {hike.times.join(', ')} • {hike.duration}
                  </span>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-5 w-5 mr-2 text-nature-500" />
                  <span>{hike.location}</span>
                </div>
              </div>
              
              <div className="flex-1 md:text-right">
                <div className="p-6 bg-gray-50 rounded-lg inline-block">
                  <div className="mb-2">
                    <span className="text-sm text-gray-500">Price per person</span>
                    <div className="text-3xl font-bold text-nature-600">${hike.price}</div>
                  </div>
                  <div className="mb-4">
                    <span className="text-sm text-gray-500">Availability</span>
                    <div className="flex items-center gap-2">
                      <span>{hike.maxParticipants - hike.currentParticipants} spots left</span>
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full" 
                          style={{ 
                            width: `${Math.min(Math.max(((hike.maxParticipants - hike.currentParticipants) / hike.maxParticipants) * 100, 20), 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <Link to={`/hikes/${hike.id}/book`}>
                    <Button className="w-full bg-nature-500 hover:bg-nature-600 text-white">
                      Book Now
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-8">
              <h2 className="text-2xl font-serif font-semibold mb-4">About This Hike</h2>
              <p className="text-gray-700 mb-6 leading-relaxed">{hike.description}</p>
              
              <h2 className="text-2xl font-serif font-semibold mb-4">What to Bring</h2>
              <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                <li>Comfortable hiking shoes</li>
                <li>Weather-appropriate clothing (layers recommended)</li>
                <li>Backpack</li>
                <li>Water bottle (at least 1L)</li>
                <li>Snacks</li>
                <li>Sunscreen and hat</li>
                <li>Camera (optional)</li>
              </ul>
              
              <h2 className="text-2xl font-serif font-semibold mb-4">Meeting Point</h2>
              <p className="text-gray-700 mb-6">Detailed meeting point information will be shared after booking. Generally, we'll meet at the trailhead 15 minutes before the scheduled start time.</p>
            </div>
            
            <div className="mt-12 text-center">
              <Link to={`/hikes/${hike.id}/book`}>
                <Button size="lg" className="bg-nature-500 hover:bg-nature-600 text-white">
                  Book This Hike
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HikeDetail;
