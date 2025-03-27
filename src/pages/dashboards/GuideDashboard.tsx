import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../main';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  Check, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Users,
  FileCheck,
  X,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, isWithinInterval, getDay } from 'date-fns';

interface Hike {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  days: string[];
  times: string[];
  location: string;
  duration: string;
  difficulty: string;
  maxParticipants: number;
  currentParticipants: number;
  bookedGuests: any[];
  status: string;
  assignedGuide: string | null;
  description: string;
  image: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: any;
  hikeId: string;
}

interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  waiverSigned: boolean;
  additionalGuests?: number;
}

interface HikeDetailsModalProps {
  hike: Hike;
  onClose: () => void;
}

const HikeDetailsModal: React.FC<HikeDetailsModalProps> = ({ hike, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-serif font-bold">{hike.title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Hike Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-medium mb-4">Hike Details</h3>
              <div className="space-y-3">
                <div className="flex items-center text-gray-600">
                  <CalendarIcon className="h-5 w-5 mr-2 text-nature-500" />
                  <span>From: {new Date(hike.startDate).toLocaleDateString()} to {new Date(hike.endDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="h-5 w-5 mr-2 text-nature-500" />
                  <span>{hike.times.join(', ')}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-5 w-5 mr-2 text-nature-500" />
                  <span>{hike.location}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Users className="h-5 w-5 mr-2 text-nature-500" />
                  <span>Participants: {hike.currentParticipants}/{hike.maxParticipants}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4">Schedule</h3>
              <div className="space-y-3">
                <div>Days: {hike.days.join(', ')}</div>
                <div>Duration: {hike.duration}</div>
                <div>Difficulty: {hike.difficulty}</div>
              </div>
            </div>
          </div>

          {/* Participants Section */}
          <div>
            <h3 className="text-lg font-medium mb-4">Participants</h3>
            {hike.bookedGuests && hike.bookedGuests.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {hike.bookedGuests.map((guest: Guest) => (
                  <div key={guest.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{guest.name}</h4>
                        <div className="text-sm text-gray-600 mt-1">
                          <div>Email: {guest.email}</div>
                          <div>Phone: {guest.phone}</div>
                          {guest.additionalGuests && guest.additionalGuests > 0 && (
                            <div className="text-nature-600">
                              +{guest.additionalGuests} additional {guest.additionalGuests === 1 ? 'guest' : 'guests'}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center">
                        {guest.waiverSigned ? (
                          <div className="flex items-center text-green-600">
                            <FileCheck className="h-5 w-5 mr-1" />
                            <span className="text-sm">Waiver Signed</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-amber-600">
                            <AlertTriangle className="h-5 w-5 mr-1" />
                            <span className="text-sm">Waiver Pending</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                No participants registered yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const HikeCard: React.FC<Hike> = (hike) => {
  const [showDetails, setShowDetails] = useState(false);
  const {
    title,
    image,
    startDate,
    endDate,
    times,
    location,
    duration,
    difficulty,
    currentParticipants,
    maxParticipants,
    days
  } = hike;

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
    <>
      <div 
        className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer"
        onClick={() => setShowDetails(true)}
      >
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
              <CalendarIcon className="h-4 w-4 mr-2 text-nature-500" />
              <span>From: {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-nature-500" />
              <span>{times.join(', ')}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-nature-500" />
              <span>{location}</span>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            <div>Duration: {duration}</div>
            <div>Days: {days.join(', ')}</div>
            <div>Participants: {currentParticipants}/{maxParticipants}</div>
          </div>
        </div>
      </div>

      {showDetails && (
        <HikeDetailsModal
          hike={hike}
          onClose={() => setShowDetails(false)}
        />
      )}
    </>
  );
};

const Calendar: React.FC<{ assignedHikes: Hike[] }> = ({ assignedHikes }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Helper function to check if a day has any hikes
  const checkHikeOnDay = (date: Date) => {
    return assignedHikes.some(hike => {
      const startDate = parseISO(hike.startDate);
      const endDate = parseISO(hike.endDate);
      
      // Check if the date is within the hike's date range
      const isInDateRange = isWithinInterval(date, { start: startDate, end: endDate });
      
      if (!isInDateRange) return false;
      
      // Get the day of week (0 = Sunday, 1 = Monday, etc.)
      const dayOfWeek = getDay(date);
      
      // Convert day names to day numbers for comparison
      const hikeDayNumbers = hike.days.map(day => {
        const dayMap: { [key: string]: number } = {
          'Sunday': 0,
          'Monday': 1,
          'Tuesday': 2,
          'Wednesday': 3,
          'Thursday': 4,
          'Friday': 5,
          'Saturday': 6
        };
        return dayMap[day];
      });
      
      // Check if this date's day of week matches one of the hike's recurring days
      return hikeDayNumbers.includes(dayOfWeek);
    });
  };

  const previousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-serif">Schedule Overview</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {/* Day names */}
          {dayNames.map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
          
          {/* Empty cells for days before the first of the month */}
          {Array.from({ length: monthStart.getDay() }).map((_, index) => (
            <div key={`empty-${index}`} className="p-2" />
          ))}
          
          {/* Calendar days */}
          {monthDays.map(day => {
            const hasHike = checkHikeOnDay(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div
                key={day.toISOString()}
                className={`
                  p-2 text-center relative cursor-pointer rounded-md
                  ${hasHike ? 'bg-green-50 hover:bg-green-100' : 'hover:bg-gray-50'}
                  ${isSelected ? 'bg-green-500 text-white hover:bg-green-600' : ''}
                  ${isToday && !isSelected ? 'border border-green-500' : ''}
                `}
                onClick={() => setSelectedDate(day)}
              >
                <span className="text-sm">{format(day, 'd')}</span>
                {hasHike && !isSelected && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                    <div className="h-1 w-1 rounded-full bg-green-500"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span>Days with assigned hikes</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const GuideDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [assignedHikes, setAssignedHikes] = useState<Hike[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch assigned hikes
      const hikesQuery = query(
        collection(db, 'hikes'),
        where('assignedGuide', '==', user.uid)
      );
      
      const hikesSnapshot = await getDocs(hikesQuery);
      const hikes = hikesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Hike[];

      // Fetch bookings for each hike
      const hikesWithBookings = await Promise.all(
        hikes.map(async (hike) => {
          const bookingsQuery = query(
            collection(db, 'bookings'),
            where('hikeId', '==', hike.id)
          );
          
          const bookingsSnapshot = await getDocs(bookingsQuery);
          const bookings = bookingsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Transform bookings into bookedGuests format
          const bookedGuests = bookings.flatMap(booking => {
            const bookingData = booking as any;
            return (bookingData.participants || []).map((participant: any) => ({
              id: `${booking.id}-${participant.fullName}`,
              name: participant.fullName || 'Guest',
              email: bookingData.bookerInfo?.email || 'Not provided',
              phone: bookingData.bookerInfo?.phone || 'Not provided',
              waiverSigned: participant.waiverSigned || false,
              additionalGuests: bookingData.additionalGuests || 0
            }));
          });

          return {
            ...hike,
            bookedGuests
          };
        })
      );

      setAssignedHikes(hikesWithBookings);

      // Fetch notifications
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('guideId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const notificationsSnapshot = await getDocs(notificationsQuery);
      const notificationsData = notificationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Error fetching guide data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      
      // Update all unread notifications
      await Promise.all(
        unreadNotifications.map(notification =>
          updateDoc(doc(db, 'notifications', notification.id), { read: true })
        )
      );

      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(n => ({ ...n, read: true }))
      );

      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 pt-32">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-serif font-bold">Guide Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.name || 'Guide'}</p>
            </div>
            <div className="mt-4 md:mt-0 flex gap-3">
              <Button variant="outline" onClick={logout} className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Left column: Notifications and Calendar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Notifications Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl font-serif">
                    <div className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Notifications
                    </div>
                  </CardTitle>
                  {notifications.some(n => !n.read) && (
                    <Button variant="outline" size="sm" onClick={markAllAsRead}>
                      <Check className="h-4 w-4 mr-2" />
                      Mark all as read
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {notifications.length > 0 ? (
                    <div className="space-y-4">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 rounded-lg border ${
                            !notification.read ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-100'
                          }`}
                        >
                          <div className="font-medium">{notification.title}</div>
                          <div className="text-sm text-gray-600 mt-1">{notification.message}</div>
                          <div className="text-xs text-gray-400 mt-2">
                            {notification.createdAt?.toDate().toLocaleDateString()}
                      </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No notifications to display
                                            </div>
                                          )}
                </CardContent>
              </Card>

              {/* Calendar Component */}
              <Calendar assignedHikes={assignedHikes} />
                                </div>
                                
            {/* Right column: Assigned Hikes */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-serif font-bold mb-6">Your Assigned Hikes</h2>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-white rounded-xl overflow-hidden shadow-lg animate-pulse">
                      <div className="h-48 bg-gray-200"></div>
                      <div className="p-6 space-y-4">
                        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
              ) : assignedHikes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {assignedHikes.map((hike) => (
                    <HikeCard key={hike.id} {...hike} />
                          ))}
                        </div>
                      ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <p className="text-xl text-gray-600">No hikes assigned yet</p>
                  <p className="mt-2 text-gray-500">You will see your assigned hikes here once they are scheduled.</p>
                        </div>
                      )}
                    </div>
                  </div>
        </div>
      </div>
    </Layout>
  );
};

export default GuideDashboard;
