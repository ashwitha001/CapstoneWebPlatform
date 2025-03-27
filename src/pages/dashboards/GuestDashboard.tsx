import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Map, LogOut, User, ChevronDown, ChevronUp } from 'lucide-react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { collection, query, where, getDocs, doc, deleteDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../main';
import { toast } from 'sonner';

interface Booking {
  id: string;
  hikeId: string;
  userId: string;
  userEmail: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  participants: Array<{
    fullName: string;
    birthdate: string;
    waiverSigned: boolean;
    signatureData?: string;
  }>;
  numberOfParticipants: number;
  price: number;
  tax: number;
  totalAmount: number;
  status: 'upcoming' | 'completed';
  createdAt: string;
  waiverStatus: 'pending' | 'completed';
  bookerInfo: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    birthdate: string;
  };
}

const GuestDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [expandedHike, setExpandedHike] = useState<string | null>(null);
  const [bookedHikes, setBookedHikes] = useState<Booking[]>([]);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('userId', '==', user.uid)
        );
        
        const querySnapshot = await getDocs(bookingsQuery);
        const fetchedBookings = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          status: doc.data().status || 'upcoming' // Default to upcoming if not set
        })) as Booking[];
        
        setBookedHikes(fetchedBookings);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        toast.error('Failed to load your bookings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  // Filter hikes based on active tab
  const filteredHikes = bookedHikes.filter(hike => 
    (activeTab === "upcoming" && hike.status === "upcoming") ||
    (activeTab === "completed" && hike.status === "completed")
  );

  // Toggle hike details expansion
  const toggleHikeExpand = (hikeId: string) => {
    setExpandedHike(expandedHike === hikeId ? null : hikeId);
  };

  const cancelBooking = async (booking: Booking) => {
    try {
      setIsCancelling(true);

      // Check if it's within 24 hours of the hike
      const hikeDate = new Date(`${booking.date} ${booking.time}`);
      const now = new Date();
      const timeDiff = hikeDate.getTime() - now.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      if (hoursDiff < 24) {
        toast.error("Bookings cannot be cancelled within 24 hours of the hike");
        return;
      }

      // Get the hike document to update participant count
      const hikeRef = doc(db, 'hikes', booking.hikeId);
      const hikeDoc = await getDoc(hikeRef);

      if (!hikeDoc.exists()) {
        toast.error("Hike not found");
        return;
      }

      // Update the hike's participant count
      await updateDoc(hikeRef, {
        currentParticipants: hikeDoc.data().currentParticipants - booking.numberOfParticipants
      });

      // Delete the booking
      const bookingRef = doc(db, 'bookings', booking.id);
      await deleteDoc(bookingRef);

      // Update local state
      setBookedHikes(prev => prev.filter(b => b.id !== booking.id));
      toast.success("Booking cancelled successfully");
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error("Failed to cancel booking");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Layout>
      <div className="pt-24 min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-serif font-bold">Your Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.name || 'Guest'}</p>
            </div>
            <div className="mt-4 md:mt-0 flex gap-3">
              <Button 
                variant="default" 
                className="bg-nature-500 hover:bg-nature-600"
                onClick={() => navigate('/hikes')}
              >
                Browse Hikes
              </Button>
              <Button variant="outline" onClick={logout} className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sidebar */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Your Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <User className="h-5 w-5 text-nature-500" />
                      <div>
                        <p className="font-medium">{user?.name || 'Guest'}</p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                        <p className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full inline-block mt-1">
                          Nature Explorer
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="md:col-span-2">
              <Tabs defaultValue="upcoming" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="upcoming">Upcoming Hikes</TabsTrigger>
                  <TabsTrigger value="completed">Past Hikes</TabsTrigger>
                </TabsList>
                
                <TabsContent value="upcoming" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Your Scheduled Hikes</CardTitle>
                      <CardDescription>View your upcoming hiking adventures</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="text-center py-8">
                          <p className="text-gray-500">Loading your bookings...</p>
                        </div>
                      ) : filteredHikes.length > 0 ? (
                        <div className="space-y-4">
                          {filteredHikes.map((hike) => (
                            <div key={hike.id} className="border rounded-lg overflow-hidden">
                              <div 
                                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer flex justify-between items-center"
                                onClick={() => toggleHikeExpand(hike.id)}
                              >
                                <div>
                                  <h3 className="font-medium">{hike.title}</h3>
                                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mt-1">
                                    <span className="flex items-center">
                                      <Calendar className="h-4 w-4 mr-1 text-nature-500" />
                                      {hike.date}
                                    </span>
                                    <span className="flex items-center">
                                      <Clock className="h-4 w-4 mr-1 text-nature-500" />
                                      {hike.time}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  {expandedHike === hike.id ? (
                                    <ChevronUp className="h-5 w-5 text-gray-400" />
                                  ) : (
                                    <ChevronDown className="h-5 w-5 text-gray-400" />
                                  )}
                                </div>
                              </div>
                              
                              {/* Expanded hike details */}
                              {expandedHike === hike.id && (
                                <div className="p-4 bg-gray-50 border-t">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                      <h4 className="font-medium text-sm text-gray-600 mb-2">Hike Details</h4>
                                      <ul className="space-y-2 text-sm">
                                        <li className="flex items-center justify-between">
                                          <span className="text-gray-600">Date:</span>
                                          <span className="font-medium">{hike.date}</span>
                                        </li>
                                        <li className="flex items-center justify-between">
                                          <span className="text-gray-600">Time:</span>
                                          <span className="font-medium">{hike.time}</span>
                                        </li>
                                        <li className="flex items-center justify-between">
                                          <span className="text-gray-600">Duration:</span>
                                          <span className="font-medium">{hike.duration}</span>
                                        </li>
                                        <li className="flex items-center justify-between">
                                          <span className="text-gray-600">Location:</span>
                                          <span className="font-medium">{hike.location}</span>
                                        </li>
                                      </ul>
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-sm text-gray-600 mb-2">Booking Information</h4>
                                      <ul className="space-y-2 text-sm">
                                        <li className="flex items-center justify-between">
                                          <span className="text-gray-600">Total Participants:</span>
                                          <span className="font-medium">{hike.numberOfParticipants}</span>
                                        </li>
                                        <li className="flex items-center justify-between">
                                          <span className="text-gray-600">Total Amount:</span>
                                          <span className="font-medium">${hike.totalAmount.toFixed(2)}</span>
                                        </li>
                                        <li className="flex items-center justify-between">
                                          <span className="text-gray-600">Waiver Status:</span>
                                          <span className={`font-medium ${hike.waiverStatus === 'completed' ? 'text-green-600' : 'text-amber-600'}`}>
                                            {hike.waiverStatus === 'completed' ? 'Completed' : 'Pending'}
                                          </span>
                                        </li>
                                      </ul>
                                    </div>
                                  </div>
                                  
                                  <div className="flex gap-2 justify-between">
                                    <Button
                                      variant="destructive"
                                      onClick={() => cancelBooking(hike)}
                                      disabled={isCancelling}
                                    >
                                      {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
                                    </Button>
                                    
                                    {hike.waiverStatus === 'pending' && (
                                      <Button variant="default" className="bg-nature-500 hover:bg-nature-600">
                                        Complete Waiver
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">You don't have any upcoming hikes</p>
                          <Button 
                            variant="outline" 
                            className="mt-3"
                            onClick={() => navigate('/hikes')}
                          >
                            Browse Available Hikes
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="completed" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Past Adventures</CardTitle>
                      <CardDescription>Review your completed hikes</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {filteredHikes.length > 0 ? (
                        <div className="space-y-4">
                          {filteredHikes.map((hike) => (
                            <div key={hike.id} className="border rounded-lg overflow-hidden">
                              <div 
                                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer flex justify-between items-center"
                                onClick={() => toggleHikeExpand(hike.id)}
                              >
                                <div>
                                  <h3 className="font-medium">{hike.title}</h3>
                                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mt-1">
                                    <span className="flex items-center">
                                      <Calendar className="h-4 w-4 mr-1 text-nature-500" />
                                      {hike.date}
                                    </span>
                                    <span className="flex items-center">
                                      <Map className="h-4 w-4 mr-1 text-nature-500" />
                                      {hike.location}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  {expandedHike === hike.id ? (
                                    <ChevronUp className="h-5 w-5 text-gray-400" />
                                  ) : (
                                    <ChevronDown className="h-5 w-5 text-gray-400" />
                                  )}
                                </div>
                              </div>
                              
                              {/* Expanded hike details */}
                              {expandedHike === hike.id && (
                                <div className="p-4 bg-gray-50 border-t">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                      <h4 className="font-medium text-sm text-gray-600 mb-2">Hike Details</h4>
                                      <ul className="space-y-2 text-sm">
                                        <li className="flex items-center justify-between">
                                          <span className="text-gray-600">Date:</span>
                                          <span className="font-medium">{hike.date}</span>
                                        </li>
                                        <li className="flex items-center justify-between">
                                          <span className="text-gray-600">Duration:</span>
                                          <span className="font-medium">{hike.duration}</span>
                                        </li>
                                        <li className="flex items-center justify-between">
                                          <span className="text-gray-600">Location:</span>
                                          <span className="font-medium">{hike.location}</span>
                                        </li>
                                      </ul>
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-sm text-gray-600 mb-2">Booking Information</h4>
                                      <ul className="space-y-2 text-sm">
                                        <li className="flex items-center justify-between">
                                          <span className="text-gray-600">Total Participants:</span>
                                          <span className="font-medium">{hike.numberOfParticipants}</span>
                                        </li>
                                        <li className="flex items-center justify-between">
                                          <span className="text-gray-600">Total Amount:</span>
                                          <span className="font-medium">${hike.totalAmount.toFixed(2)}</span>
                                        </li>
                                      </ul>
                                    </div>
                                  </div>
                                  
                                  <div className="flex justify-end mt-2">
                                    <Button size="sm" variant="outline" onClick={() => navigate(`/hikes/${hike.hikeId}`)}>
                                      View Hike
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">You haven't completed any hikes yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GuestDashboard;
