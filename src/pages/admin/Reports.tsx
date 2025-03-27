import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, CreditCard, FileCheck, Users } from 'lucide-react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../main';

interface Hike {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  times: string[];
  location: string;
  bookedGuests: any[];
  currentParticipants: number;
  price: number;
}

interface Booking {
  id: string;
  hikeId: string;
  userId: string;
  userEmail: string;
  title: string;
  date: string;
  time: string;
  totalAmount: number;
  status: string;
  waiverStatus: 'pending' | 'completed';
  createdAt: string;
  participants: Array<{
    fullName: string;
    waiverSigned: boolean;
  }>;
}

const Reports: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hikes, setHikes] = useState<Hike[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState('payments');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch hikes
      const hikesRef = collection(db, 'hikes');
      const hikesSnapshot = await getDocs(hikesRef);
      const hikesData = hikesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Hike[];
      setHikes(hikesData);
      
      // Fetch bookings
      const bookingsRef = collection(db, 'bookings');
      const bookingsSnapshot = await getDocs(bookingsRef);
      const bookingsData = bookingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Booking[];
      setBookings(bookingsData);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalRevenue = bookings
    .filter(booking => booking.status === 'upcoming' || booking.status === 'completed')
    .reduce((total, booking) => total + booking.totalAmount, 0);
  
  const totalBookings = bookings.length;
  
  const totalParticipants = bookings.reduce((total, booking) => 
    total + booking.participants.length, 0);

  // Group waivers by hike
  const waiversByHike = bookings.reduce((acc, booking) => {
    if (!acc[booking.hikeId]) {
      acc[booking.hikeId] = {
        hikeId: booking.hikeId,
        hikeName: booking.title,
        records: []
      };
    }
    
    booking.participants.forEach(participant => {
      acc[booking.hikeId].records.push({
        hikeId: booking.hikeId,
        hikeName: booking.title,
        userId: booking.userId,
        userName: participant.fullName,
        email: booking.userEmail,
        signed: participant.waiverSigned,
        signedDate: booking.createdAt
      });
    });
    
    return acc;
  }, {} as Record<string, { hikeId: string; hikeName: string; records: any[] }>);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <Button variant="outline" onClick={() => navigate('/admin-dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            <h1 className="text-4xl font-serif font-bold">Reports</h1>
            <p className="text-gray-600 mt-1">View booking payments and waiver information.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${totalRevenue.toFixed(2)}</div>
                <p className="text-sm text-gray-500 mt-1">From {totalBookings} bookings</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500">Total Participants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalParticipants}</div>
                <p className="text-sm text-gray-500 mt-1">Across {hikes.length} different hikes</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500">Active Hikes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{hikes.length}</div>
                <p className="text-sm text-gray-500 mt-1">Currently available</p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <Tabs defaultValue="payments" onValueChange={setActiveTab}>
              <div className="px-6 pt-6">
                <TabsList className="mb-6">
                  <TabsTrigger value="payments">Payment Reports</TabsTrigger>
                  <TabsTrigger value="waivers">Waiver Reports</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="payments" className="p-6">
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hike
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Guest
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bookings.map((booking) => (
                        <tr key={booking.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{booking.title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{booking.userEmail}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(booking.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              ${booking.totalAmount.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              booking.status === 'completed' 
                                ? 'bg-green-100 text-green-800'
                                : booking.status === 'upcoming'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {booking.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="waivers" className="p-6">
                <div className="space-y-6">
                  {Object.values(waiversByHike).map((hikeWaivers) => (
                    <div key={hikeWaivers.hikeId} className="rounded-md border overflow-hidden">
                      <div className="bg-gray-50 px-6 py-3">
                        <h3 className="text-lg font-medium text-gray-900">{hikeWaivers.hikeName}</h3>
                      </div>
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Guest Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Waiver Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Signed Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {hikeWaivers.records.map((record, index) => (
                            <tr key={`${record.userId}-${index}`}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{record.userName}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{record.email}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  record.signed
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {record.signed ? 'Signed' : 'Pending'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {record.signed ? new Date(record.signedDate).toLocaleDateString() : '-'}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
