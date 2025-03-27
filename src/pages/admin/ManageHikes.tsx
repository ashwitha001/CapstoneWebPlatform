import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PlusCircle, Edit as EditIcon, Trash, ArrowLeft, ImageIcon, Upload } from 'lucide-react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../main';

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
  price: number;
}

const DAYS_OF_WEEK = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];

const initialHikes: Hike[] = [
  {
    id: '1',
    title: 'Banff Sulphur Mountain Trail',
    startDate: '2024-06-01',
    endDate: '2024-08-31',
    days: ['Monday', 'Wednesday', 'Friday'],
    times: ['08:00', '13:00'],
    duration: '4 hours',
    location: 'Banff National Park, AB',
    difficulty: 'Moderate',
    maxParticipants: 12,
    currentParticipants: 0,
    bookedGuests: [],
    status: 'upcoming',
    assignedGuide: null,
    image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&q=80&w=1974',
    description: 'Experience the beautiful views from Sulphur Mountain in Banff National Park.',
    price: 79.99
  },
  {
    id: '2',
    title: 'Bruce Trail Experience',
    startDate: '2024-06-01',
    endDate: '2024-09-15',
    days: ['Tuesday', 'Thursday', 'Saturday'],
    times: ['09:00', '14:00'],
    duration: '6 hours',
    location: 'Niagara Region, ON',
    difficulty: 'Moderate',
    maxParticipants: 15,
    currentParticipants: 0,
    bookedGuests: [],
    status: 'upcoming',
    assignedGuide: null,
    image: 'https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?auto=format&fit=crop&q=80&w=1974',
    description: 'Explore the oldest and longest marked hiking trail in Canada.',
    price: 89.99
  },
  {
    id: '3',
    title: 'Garibaldi Lake Trek',
    startDate: '2024-07-01',
    endDate: '2024-08-31',
    days: ['Friday', 'Saturday', 'Sunday'],
    times: ['07:30', '12:30'],
    duration: '8 hours',
    location: 'Garibaldi Provincial Park, BC',
    difficulty: 'Challenging',
    maxParticipants: 8,
    currentParticipants: 0,
    bookedGuests: [],
    status: 'upcoming',
    assignedGuide: null,
    image: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&q=80&w=1974',
    description: 'A challenging hike to discover the pristine mountain lakes of Garibaldi Provincial Park.',
    price: 129.99
  },
];

interface NewHike {
  title: string;
  startDate: string;
  endDate: string;
  days: string[];
  times: string[];
  duration: string;
  location: string;
  difficulty: string;
  maxParticipants: number;
  description: string;
  image: string;
  price: number;
}

const ManageHikes: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hikes, setHikes] = useState<Hike[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hikeToDelete, setHikeToDelete] = useState<string | null>(null);
  const [currentHike, setCurrentHike] = useState<Hike | null>(null);
  const [newTime, setNewTime] = useState<string>('');
  const [editingTimes, setEditingTimes] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [newHike, setNewHike] = useState<NewHike>({
    title: '',
    startDate: '',
    endDate: '',
    days: [],
    times: [],
    duration: '',
    location: '',
    difficulty: 'Moderate',
    maxParticipants: 10,
    description: '',
    image: '',
    price: 79.99
  });
  
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchHikes();
  }, []);

  const fetchHikes = async () => {
    try {
      setLoading(true);
      const hikesRef = collection(db, 'hikes');
      const hikesSnapshot = await getDocs(hikesRef);
      const hikesData = hikesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Hike[];
      setHikes(hikesData);
    } catch (error) {
      console.error('Error fetching hikes:', error);
      toast.error('Failed to load hikes');
    } finally {
      setLoading(false);
    }
  };

  const handleHikeFormChange = (field: keyof NewHike, value: string | number | string[]) => {
    setNewHike(prev => ({ ...prev, [field]: value }));
  };
  
  const handleEditFormChange = (field: keyof Hike, value: string | number | null | string[]) => {
    if (currentHike) {
      setCurrentHike(prev => {
        if (prev) return { ...prev, [field]: value };
        return prev;
      });
    }
  };

  const handleDayToggle = (day: string, isEdit: boolean = false) => {
    if (isEdit && currentHike) {
      const updatedDays = currentHike.days.includes(day)
        ? currentHike.days.filter(d => d !== day)
        : [...currentHike.days, day];
      handleEditFormChange('days', updatedDays);
    } else {
      const updatedDays = newHike.days.includes(day)
        ? newHike.days.filter(d => d !== day)
        : [...newHike.days, day];
      handleHikeFormChange('days', updatedDays);
    }
  };

  const handleAddTime = (isEdit: boolean = false) => {
    if (newTime) {
      if (isEdit && currentHike) {
        const updatedTimes = [...currentHike.times, newTime];
        handleEditFormChange('times', updatedTimes);
      } else {
        const updatedTimes = [...newHike.times, newTime];
        handleHikeFormChange('times', updatedTimes);
      }
      setNewTime('');
    }
  };

  const handleRemoveTime = (time: string, isEdit: boolean = false) => {
    if (isEdit && currentHike) {
      const updatedTimes = currentHike.times.filter(t => t !== time);
      handleEditFormChange('times', updatedTimes);
    } else {
      const updatedTimes = newHike.times.filter(t => t !== time);
      handleHikeFormChange('times', updatedTimes);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (currentHike) {
          handleEditFormChange('image', base64String);
        } else {
          handleHikeFormChange('image', base64String);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddHike = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const newHikeData = {
        ...newHike,
        currentParticipants: 0,
        bookedGuests: [],
        status: 'upcoming',
        assignedGuide: null,
        price: newHike.price
      };
      
      const docRef = await addDoc(collection(db, 'hikes'), newHikeData);
      
      toast.success("New hike added", {
        description: `${newHike.title} has been added to the hikes list.`
      });
      
      setAddDialogOpen(false);
      fetchHikes();
      
      setNewHike({
        title: '',
        startDate: '',
        endDate: '',
        days: [],
        times: [],
        duration: '',
        location: '',
        difficulty: 'Moderate',
        maxParticipants: 10,
        description: '',
        image: '',
        price: 79.99
      });
      setImageFile(null);
    } catch (error) {
      console.error('Error adding hike:', error);
      toast.error('Failed to add hike');
    }
  };

  const handleOpenEditDialog = (hike: Hike) => {
    setCurrentHike(hike);
    setEditingTimes(hike.times);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentHike) {
      try {
        const hikeRef = doc(db, 'hikes', currentHike.id);
        await updateDoc(hikeRef, {
          title: currentHike.title,
          startDate: currentHike.startDate,
          endDate: currentHike.endDate,
          days: currentHike.days,
          times: currentHike.times,
          duration: currentHike.duration,
          location: currentHike.location,
          difficulty: currentHike.difficulty,
          maxParticipants: currentHike.maxParticipants,
          description: currentHike.description,
          image: currentHike.image,
          price: currentHike.price
        });
        
        toast.success("Hike updated", {
          description: `${currentHike.title} has been updated successfully.`
        });
        
        setEditDialogOpen(false);
        fetchHikes();
      } catch (error) {
        console.error('Error updating hike:', error);
        toast.error('Failed to update hike');
      }
    }
  };
  
  const confirmDeleteHike = (hikeId: string) => {
    setHikeToDelete(hikeId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteHike = async () => {
    if (hikeToDelete) {
      try {
        const hikeToRemove = hikes.find(hike => hike.id === hikeToDelete);
        await deleteDoc(doc(db, 'hikes', hikeToDelete));
        
        toast.success("Hike deleted", {
          description: hikeToRemove ? `${hikeToRemove.title} has been removed.` : "The hike has been removed."
        });
        
        setDeleteDialogOpen(false);
        setHikeToDelete(null);
        fetchHikes();
      } catch (error) {
        console.error('Error deleting hike:', error);
        toast.error('Failed to delete hike');
      }
    }
  };

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
            <h1 className="text-4xl font-serif font-bold">Manage Hikes</h1>
            <p className="text-gray-600 mt-1">Add, edit, and remove hiking experiences.</p>
          </div>

          <div className="mb-8 flex justify-between items-center">
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add New Hike
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleAddHike}>
                  <DialogHeader>
                    <DialogTitle>Add New Hike</DialogTitle>
                    <DialogDescription>
                      Fill out the details to add a new hike to your database.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="hike-title">Hike Name</Label>
                      <Input 
                        id="hike-title" 
                        value={newHike.title}
                        onChange={(e) => handleHikeFormChange('title', e.target.value)}
                        placeholder="e.g. Banff Sulphur Mountain Trail" 
                        required 
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="hike-start-date">Start Date</Label>
                        <Input 
                          id="hike-start-date" 
                          type="date"
                          value={newHike.startDate}
                          onChange={(e) => handleHikeFormChange('startDate', e.target.value)}
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hike-end-date">End Date</Label>
                        <Input 
                          id="hike-end-date" 
                          type="date"
                          value={newHike.endDate}
                          onChange={(e) => handleHikeFormChange('endDate', e.target.value)}
                          required 
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Days of the Week</Label>
                      <div className="flex flex-wrap gap-2">
                        {DAYS_OF_WEEK.map(day => (
                          <div key={day} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`day-${day}`} 
                              checked={newHike.days.includes(day)}
                              onCheckedChange={() => handleDayToggle(day)}
                            />
                            <label 
                              htmlFor={`day-${day}`} 
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {day}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Hike Times</Label>
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <Input 
                            type="time"
                            value={newTime}
                            onChange={(e) => setNewTime(e.target.value)}
                            placeholder="Add time"
                          />
                        </div>
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => handleAddTime()}
                        >
                          Add Time
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {newHike.times.map((time, index) => (
                          <div key={index} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                            <span>{time}</span>
                            <button 
                              type="button" 
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleRemoveTime(time)}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="hike-duration">Duration</Label>
                        <Input 
                          id="hike-duration" 
                          value={newHike.duration}
                          onChange={(e) => handleHikeFormChange('duration', e.target.value)}
                          placeholder="e.g. 4 hours" 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hike-participants">Max Participants</Label>
                        <Input 
                          id="hike-participants" 
                          type="number"
                          min="1"
                          value={newHike.maxParticipants}
                          onChange={(e) => handleHikeFormChange('maxParticipants', parseInt(e.target.value))}
                          required 
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="hike-price">Price per Person ($)</Label>
                      <Input 
                        id="hike-price" 
                        type="number"
                        min="0"
                        step="0.01"
                        value={newHike.price}
                        onChange={(e) => handleHikeFormChange('price', parseFloat(e.target.value))}
                        placeholder="e.g. 79.99" 
                        required 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="hike-location">Location</Label>
                      <Input 
                        id="hike-location" 
                        value={newHike.location}
                        onChange={(e) => handleHikeFormChange('location', e.target.value)}
                        placeholder="e.g. Banff National Park, AB" 
                        required 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="hike-difficulty">Difficulty</Label>
                      <Select 
                        value={newHike.difficulty} 
                        onValueChange={(value) => handleHikeFormChange('difficulty', value)}
                      >
                        <SelectTrigger id="hike-difficulty">
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Easy">Easy</SelectItem>
                          <SelectItem value="Moderate">Moderate</SelectItem>
                          <SelectItem value="Challenging">Challenging</SelectItem>
                          <SelectItem value="Difficult">Difficult</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="hike-description">Description</Label>
                      <Textarea 
                        id="hike-description" 
                        value={newHike.description}
                        onChange={(e) => handleHikeFormChange('description', e.target.value)}
                        placeholder="Describe the hike experience..." 
                        rows={3}
                        required 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="hike-image">Image</Label>
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center justify-center w-full">
                          <label 
                            htmlFor="dropzone-file" 
                            className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Upload className="w-8 h-8 mb-4 text-gray-500" />
                              <p className="mb-2 text-sm text-gray-500">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                              </p>
                              <p className="text-xs text-gray-500">PNG, JPG or GIF</p>
                            </div>
                            <input 
                              id="dropzone-file" 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={handleFileChange}
                            />
                          </label>
                        </div>
                        {newHike.image && (
                          <div className="relative w-full h-32">
                            <img 
                              src={newHike.image} 
                              alt="Hike preview" 
                              className="w-full h-full object-cover rounded-md"
                            />
                          </div>
                        )}
                        <Input 
                          id="hike-image-url" 
                          value={newHike.image}
                          onChange={(e) => handleHikeFormChange('image', e.target.value)}
                          placeholder="Or enter image URL: https://example.com/image.jpg" 
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={!newHike.title || !newHike.startDate || !newHike.location || newHike.days.length === 0 || newHike.times.length === 0}
                    >
                      Add Hike
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hikes.map((hike) => (
              <Card key={hike.id} className="overflow-hidden shadow-md">
                <div className="relative">
                  <div className="h-48 bg-gray-200 flex items-center justify-center">
                    {hike.image ? (
                      <img src={hike.image} alt={hike.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <ImageIcon size={40} />
                        <span className="mt-2 text-sm">No image available</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute top-3 right-3 flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="bg-white h-8"
                      onClick={() => handleOpenEditDialog(hike)}
                    >
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8"
                      onClick={() => confirmDeleteHike(hike.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="text-xl font-serif font-semibold mb-2">{hike.title}</h3>
                  <div className="space-y-1 text-sm text-gray-500">
                    <p>Start: {new Date(hike.startDate).toLocaleDateString()}</p>
                    <p>End: {new Date(hike.endDate).toLocaleDateString()}</p>
                    <p>Days: {hike.days.join(', ')}</p>
                    <p>Times: {hike.times.join(', ')}</p>
                    <p>Location: {hike.location}</p>
                    <p>Difficulty: {hike.difficulty}</p>
                    <p>Duration: {hike.duration}</p>
                    <p>Max Participants: {hike.maxParticipants}</p>
                    <p>Price: ${typeof hike.price === 'number' ? hike.price.toFixed(2) : '0.00'}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              {currentHike && (
                <form onSubmit={handleSaveEdit}>
                  <DialogHeader>
                    <DialogTitle>Edit Hike</DialogTitle>
                    <DialogDescription>
                      Update the details for this hike.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-title">Hike Name</Label>
                      <Input 
                        id="edit-title" 
                        value={currentHike.title}
                        onChange={(e) => handleEditFormChange('title', e.target.value)}
                        required 
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-start-date">Start Date</Label>
                        <Input 
                          id="edit-start-date" 
                          type="date"
                          value={currentHike.startDate}
                          onChange={(e) => handleEditFormChange('startDate', e.target.value)}
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-end-date">End Date</Label>
                        <Input 
                          id="edit-end-date" 
                          type="date"
                          value={currentHike.endDate}
                          onChange={(e) => handleEditFormChange('endDate', e.target.value)}
                          required 
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Days of the Week</Label>
                      <div className="flex flex-wrap gap-2">
                        {DAYS_OF_WEEK.map(day => (
                          <div key={day} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`edit-day-${day}`} 
                              checked={currentHike.days.includes(day)}
                              onCheckedChange={() => handleDayToggle(day, true)}
                            />
                            <label 
                              htmlFor={`edit-day-${day}`} 
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {day}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Hike Times</Label>
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <Input 
                            type="time"
                            value={newTime}
                            onChange={(e) => setNewTime(e.target.value)}
                            placeholder="Add time"
                          />
                        </div>
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => handleAddTime(true)}
                        >
                          Add Time
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {currentHike.times.map((time, index) => (
                          <div key={index} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                            <span>{time}</span>
                            <button 
                              type="button" 
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleRemoveTime(time, true)}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-duration">Duration</Label>
                        <Input 
                          id="edit-duration" 
                          value={currentHike.duration}
                          onChange={(e) => handleEditFormChange('duration', e.target.value)}
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-participants">Max Participants</Label>
                        <Input 
                          id="edit-participants" 
                          type="number"
                          min="1"
                          value={currentHike.maxParticipants}
                          onChange={(e) => handleEditFormChange('maxParticipants', parseInt(e.target.value))}
                          required 
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-price">Price per Person ($)</Label>
                      <Input 
                        id="edit-price" 
                        type="number"
                        min="0"
                        step="0.01"
                        value={currentHike.price}
                        onChange={(e) => handleEditFormChange('price', parseFloat(e.target.value))}
                        required 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-location">Location</Label>
                      <Input 
                        id="edit-location" 
                        value={currentHike.location}
                        onChange={(e) => handleEditFormChange('location', e.target.value)}
                        required 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-difficulty">Difficulty</Label>
                      <Select 
                        value={currentHike.difficulty} 
                        onValueChange={(value) => handleEditFormChange('difficulty', value)}
                      >
                        <SelectTrigger id="edit-difficulty">
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Easy">Easy</SelectItem>
                          <SelectItem value="Moderate">Moderate</SelectItem>
                          <SelectItem value="Challenging">Challenging</SelectItem>
                          <SelectItem value="Difficult">Difficult</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-description">Description</Label>
                      <Textarea 
                        id="edit-description" 
                        value={currentHike.description}
                        onChange={(e) => handleEditFormChange('description', e.target.value)}
                        rows={3}
                        required 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-image">Image</Label>
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center justify-center w-full">
                          <label 
                            htmlFor="edit-dropzone-file" 
                            className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Upload className="w-8 h-8 mb-4 text-gray-500" />
                              <p className="mb-2 text-sm text-gray-500">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                              </p>
                              <p className="text-xs text-gray-500">PNG, JPG or GIF</p>
                            </div>
                            <input 
                              id="edit-dropzone-file" 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={handleFileChange}
                            />
                          </label>
                        </div>
                        {currentHike.image && (
                          <div className="relative w-full h-32">
                            <img 
                              src={currentHike.image} 
                              alt="Hike preview" 
                              className="w-full h-full object-cover rounded-md"
                            />
                          </div>
                        )}
                        <Input 
                          id="edit-image-url" 
                          value={currentHike.image}
                          onChange={(e) => handleEditFormChange('image', e.target.value)}
                          placeholder="Or enter image URL: https://example.com/image.jpg" 
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">
                      Save Changes
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
          
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the hike
                  and remove it from the system.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setHikeToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDeleteHike}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Layout>
  );
};

export default ManageHikes;

