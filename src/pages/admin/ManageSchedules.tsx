import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Calendar, ArrowLeft, User, Check } from 'lucide-react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { collection, query, getDocs, doc, updateDoc, where, getDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '../../main';

interface Guide {
  uid: string;
  name: string;
  email: string;
  role: string;
}

interface Hike {
  id: string;
  title: string;
  image: string;
  startDate: string;
  endDate: string;
  days: string[];
  times: string[];
  duration: string;
  location: string;
  difficulty: string;
  maxParticipants: number;
  currentParticipants: number;
  bookedGuests: any[];
  status: string;
  assignedGuide: string | null;
  description: string;
}

const ManageSchedules: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hikes, setHikes] = useState<Hike[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  // Fetch hikes and guides from Firestore
  useEffect(() => {
    window.scrollTo(0, 0);
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch guides
        const guidesRef = collection(db, 'users');
        const guidesQuery = query(guidesRef, where("role", "==", "guide"));
        const guidesSnapshot = await getDocs(guidesQuery);
        const guidesData = guidesSnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        })) as Guide[];
        setGuides(guidesData);
        
        // Fetch hikes
        const hikesRef = collection(db, 'hikes');
        const hikesSnapshot = await getDocs(hikesRef);
        const hikesData = hikesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Hike[];
        setHikes(hikesData);
        
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load schedules");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Group hikes by upcoming or past
  const now = new Date();
  const upcomingHikes = hikes.filter(hike => new Date(hike.endDate) >= now);
  const pastHikes = hikes.filter(hike => new Date(hike.endDate) < now);
  
  const assignGuideToHike = async (hikeId: string, guideId: string) => {
    try {
      if (guideId === "unassigned") {
        // Handle unassigning a guide
        await updateDoc(doc(db, 'hikes', hikeId), {
          assignedGuide: null,
          assignedAt: null,
        });

        toast.success('Guide unassigned successfully.');
        
        // Update local state
        setHikes(prevHikes => 
          prevHikes.map(hike => 
            hike.id === hikeId 
              ? { ...hike, assignedGuide: null }
              : hike
          )
        );
        return;
      }

      // Get the guide's email and the hike details
      const [guideDoc, hikeDoc] = await Promise.all([
        getDoc(doc(db, 'users', guideId)),
        getDoc(doc(db, 'hikes', hikeId))
      ]);

      const guideEmail = guideDoc.data()?.email;
      const hikeName = hikeDoc.data()?.title;

      if (!guideEmail) {
        toast.error('Guide email not found');
        return;
      }

      // Create notification in Firestore
      await addDoc(collection(db, 'notifications'), {
        userId: guideId,
        type: 'HIKE_ASSIGNMENT',
        title: 'New Hike Assignment',
        message: `You have been assigned to guide "${hikeName}"`,
        hikeId: hikeId,
        createdAt: serverTimestamp(),
        read: false
      });

      // Update the hike document with the assigned guide
      await updateDoc(doc(db, 'hikes', hikeId), {
        assignedGuide: guideId,
        assignedAt: serverTimestamp(),
      });

      toast.success('Guide assigned successfully! They will receive a notification.');
      
      // Update local state
      setHikes(prevHikes => 
        prevHikes.map(hike => 
          hike.id === hikeId 
            ? { ...hike, assignedGuide: guideId }
            : hike
        )
      );
    } catch (error) {
      console.error('Error assigning guide:', error);
      toast.error('Failed to assign guide. Please try again.');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 pt-32">
          <div className="container mx-auto px-4">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 pt-32">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <Button variant="outline" onClick={() => navigate('/admin-dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            <h1 className="text-4xl font-serif font-bold">Manage Schedules</h1>
            <p className="text-gray-600 mt-1">Assign guides to upcoming hikes and manage the hiking schedule.</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <Tabs defaultValue="upcoming" onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="upcoming">Upcoming Hikes</TabsTrigger>
                <TabsTrigger value="past">Past Hikes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upcoming">
                {upcomingHikes.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {upcomingHikes.map((hike) => (
                      <Card key={hike.id} className="overflow-hidden">
                        <CardHeader className="pb-2 bg-gray-50">
                          <CardTitle className="text-lg">{hike.title}</CardTitle>
                          <div className="text-sm text-gray-500">
                            {new Date(hike.startDate).toLocaleDateString()} to {new Date(hike.endDate).toLocaleDateString()}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="space-y-4">
                            <div className="text-sm text-gray-600">
                              <div>Location: {hike.location}</div>
                              <div>Days: {hike.days.join(', ')}</div>
                              <div>Times: {hike.times.join(', ')}</div>
                              <div>Duration: {hike.duration}</div>
                              <div>Difficulty: {hike.difficulty}</div>
                              <div>
                                Participants: {hike.currentParticipants}/{hike.maxParticipants}
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <label className="text-sm font-medium">Assigned Guide:</label>
                                {hike.assignedGuide && (
                                  <div className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full flex items-center">
                                    <Check className="h-3 w-3 mr-1" />
                                    Assigned
                                  </div>
                                )}
                              </div>
                              <Select 
                                value={hike.assignedGuide || "unassigned"} 
                                onValueChange={(value) => assignGuideToHike(hike.id, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a guide" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="unassigned">-- Unassigned --</SelectItem>
                                  {guides.map(guide => (
                                    <SelectItem key={guide.uid} value={guide.uid}>
                                      {guide.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-12 bg-gray-50 rounded-lg">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No Upcoming Hikes</h3>
                    <p className="text-gray-500 mt-1">
                      There are no upcoming hikes to schedule. Add new hikes from the Manage Hikes page.
                    </p>
                    <Button 
                      className="mt-4" 
                      variant="outline"
                      onClick={() => navigate('/admin/hikes')}
                    >
                      Go to Manage Hikes
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="past">
                {pastHikes.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {pastHikes.map((hike) => (
                      <Card key={hike.id} className="overflow-hidden opacity-75">
                        <CardHeader className="pb-2 bg-gray-50">
                          <CardTitle className="text-lg">{hike.title}</CardTitle>
                          <div className="text-sm text-gray-500">
                            {new Date(hike.startDate).toLocaleDateString()} to {new Date(hike.endDate).toLocaleDateString()}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="space-y-4">
                            <div className="text-sm text-gray-600">
                              <div>Location: {hike.location}</div>
                              <div>Days: {hike.days.join(', ')}</div>
                              <div>Times: {hike.times.join(', ')}</div>
                              <div>Duration: {hike.duration}</div>
                              <div>Difficulty: {hike.difficulty}</div>
                              <div>
                                Final Participants: {hike.currentParticipants}/{hike.maxParticipants}
                              </div>
                              <div>
                                Guide: {hike.assignedGuide ? 
                                  guides.find(g => g.uid === hike.assignedGuide)?.name || hike.assignedGuide 
                                  : 'No guide assigned'}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-12 bg-gray-50 rounded-lg">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No Past Hikes</h3>
                    <p className="text-gray-500 mt-1">
                      There are no past hikes to display.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ManageSchedules;
