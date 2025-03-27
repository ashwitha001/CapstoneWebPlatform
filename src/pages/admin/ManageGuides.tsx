import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { User, PlusCircle, Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  getAuth, 
  initializeAuth,
  updateProfile 
} from 'firebase/auth';
import { db } from '../../main';

interface Guide {
  uid: string;
  name: string;
  email: string;
  role: string;
}

interface PendingGuide {
  id: string;
  name: string;
  email: string;
  role: string;
  isPending: boolean;
}

type GuideListItem = Guide | PendingGuide;

const getGuideId = (guide: GuideListItem): string => {
  return 'uid' in guide ? guide.uid : guide.id;
};

const ManageGuides: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const auth = getAuth();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [newGuideName, setNewGuideName] = useState('');
  const [newGuideEmail, setNewGuideEmail] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [pendingGuides, setPendingGuides] = useState<PendingGuide[]>([]);
  const [addGuideDialogOpen, setAddGuideDialogOpen] = useState(false);
  
  // Load guides from Firestore and pending guides from localStorage
  useEffect(() => {
    window.scrollTo(0, 0);
    
    const fetchGuides = async () => {
      try {
        const guidesRef = collection(db, 'users');
        const q = query(guidesRef, where("role", "==", "guide"));
        const querySnapshot = await getDocs(q);
        const guidesData = querySnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        })) as Guide[];
        setGuides(guidesData);
      } catch (error) {
        console.error("Error fetching guides:", error);
        toast.error("Failed to load guides");
      }
    };

    fetchGuides();
    
    const storedPendingGuides = localStorage.getItem('pendingGuides');
    if (storedPendingGuides) {
      setPendingGuides(JSON.parse(storedPendingGuides));
    }
  }, []);
  
  // Save pending guides to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('pendingGuides', JSON.stringify(pendingGuides));
  }, [pendingGuides]);

  const allGuidesList = [
    ...guides,
    ...pendingGuides.filter(pg => !guides.some(g => g.email === pg.email))
  ];

  const handleRegisterGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    
    try {
      // Generate a random password for initial account creation
      const tempPassword = Math.random().toString(36).slice(-8);
      
      // Create a secondary auth instance for guide creation
      const secondaryAuth = getAuth();
      const currentUser = secondaryAuth.currentUser;
      
      // Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        newGuideEmail,
        tempPassword
      );
      
      // Set the display name for the new guide
      await updateProfile(userCredential.user, {
        displayName: newGuideName
      });
      
      // Create the user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: newGuideName,
        email: newGuideEmail,
        role: 'guide',
        createdAt: new Date().toISOString()
      });
      
      // Send password reset email to let them set their own password
      await sendPasswordResetEmail(secondaryAuth, newGuideEmail);
      
      // Sign back in as the admin if needed
      if (currentUser) {
        secondaryAuth.updateCurrentUser(currentUser);
      }
      
      // Update local state
      const newGuide: Guide = {
        uid: userCredential.user.uid,
        name: newGuideName,
        email: newGuideEmail,
        role: 'guide'
      };
      
      setGuides([...guides, newGuide]);
      
      toast.success("Guide invitation sent", {
        description: `${newGuideName} will receive an email to set up their account.`,
      });
      
      // Clear form and close modal
      setNewGuideName('');
      setNewGuideEmail('');
      setAddGuideDialogOpen(false);
    } catch (error: any) {
      console.error("Error registering guide:", error);
      toast.error("Failed to send invitation", {
        description: error.message || "Please try again later.",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Button
          onClick={() => navigate('/admin-dashboard')}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold mb-2">Guide Staff</h1>
          <p className="text-gray-600">Add, remove, and view guides for your hiking program.</p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-serif">Currently {guides.length} guides in the system</h2>
          <Button onClick={() => setAddGuideDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Guide
          </Button>
        </div>

        <div className="grid gap-4">
          {allGuidesList.map((guide) => (
            <div
              key={getGuideId(guide)}
              className="bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-gray-100 p-2 rounded-full">
                  <User className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-medium">{guide.name}</h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <Mail className="h-4 w-4 mr-1" />
                    {guide.email}
                  </div>
                </div>
              </div>
              {'isPending' in guide && (
                <span className="text-amber-600 text-sm flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Invitation Sent
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Information about guide deletion */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-medium text-blue-800 mb-2">Guide Account Management</h3>
          <p className="text-blue-700">
            For security reasons, guide accounts can only be deleted through the Firebase Authentication Console. 
            Please contact your system administrator or access the Firebase Console directly to manage guide accounts.
          </p>
        </div>

        <Dialog open={addGuideDialogOpen} onOpenChange={setAddGuideDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Guide</DialogTitle>
              <DialogDescription>
                Send an invitation to a new guide. They will receive an email to set up their account.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRegisterGuide}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Guide Name</Label>
                  <Input
                    id="name"
                    value={newGuideName}
                    onChange={(e) => setNewGuideName(e.target.value)}
                    placeholder="Enter guide's full name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Guide Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newGuideEmail}
                    onChange={(e) => setNewGuideEmail(e.target.value)}
                    placeholder="Enter guide's email"
                    required
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button
                  type="submit"
                  disabled={isRegistering}
                >
                  {isRegistering ? 'Sending Invitation...' : 'Send Invitation'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ManageGuides;
