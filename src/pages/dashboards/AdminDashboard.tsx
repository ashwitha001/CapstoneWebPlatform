import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, MapPin, FileText, User } from 'lucide-react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../main';

interface FirebaseUser {
  uid: string;
  name: string;
  email: string;
  role: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [guides, setGuides] = useState<FirebaseUser[]>([]);
  const [guests, setGuests] = useState<FirebaseUser[]>([]);
  
  // Scroll to top when entering the dashboard
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch users from Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, 'users');
        
        // Fetch guides
        const guidesQuery = query(usersRef, where("role", "==", "guide"));
        const guidesSnapshot = await getDocs(guidesQuery);
        const guidesData = guidesSnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        })) as FirebaseUser[];
        setGuides(guidesData);

        // Fetch guests
        const guestsQuery = query(usersRef, where("role", "==", "guest"));
        const guestsSnapshot = await getDocs(guestsQuery);
        const guestsData = guestsSnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        })) as FirebaseUser[];
        setGuests(guestsData);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 pt-32">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-serif font-bold">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user?.name || 'Admin'}! Manage your hiking operations here.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/guides')}>
              <CardHeader className="pb-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-3xl font-serif">Manage Guides</CardTitle>
                <CardDescription className="text-lg">Assign guides to hikes and manage staff</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm font-medium">
                  {guides.length} {guides.length === 1 ? 'Guide' : 'Guides'} Currently Active
                </div>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/hikes')}>
              <CardHeader className="pb-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-2">
                  <MapPin className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-3xl font-serif">Manage Hikes</CardTitle>
                <CardDescription className="text-lg">Add, edit and remove hikes</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm font-medium">Manage all hiking experiences</div>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/schedules')}>
              <CardHeader className="pb-4">
                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-2">
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-3xl font-serif">Manage Schedules</CardTitle>
                <CardDescription className="text-lg">Assign guides to upcoming hikes</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm font-medium">Plan and organize guide schedules</div>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/reports')}>
              <CardHeader className="pb-4">
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-2">
                  <FileText className="h-8 w-8 text-amber-600" />
                </div>
                <CardTitle className="text-3xl font-serif">Reports</CardTitle>
                <CardDescription className="text-lg">View booking and waiver reports</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm font-medium">Access guest information and analytics</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
