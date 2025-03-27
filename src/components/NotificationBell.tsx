import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../main';
import { useAuth } from '../context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: any;
  hikeId: string;
}

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;

    // Subscribe to notifications for this user
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      
      setNotifications(notifs.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
      setUnreadCount(notifs.filter(n => !n.read).length);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    await updateDoc(doc(db, 'notifications', notification.id), {
      read: true
    });

    // Navigate to guide dashboard
    navigate('/guide-dashboard');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-3 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
            >
              <div>
                <div className="font-medium">{notification.title}</div>
                <div className="text-sm text-gray-500">{notification.message}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {notification.createdAt?.toDate().toLocaleDateString()}
                </div>
              </div>
            </DropdownMenuItem>
          ))
        ) : (
          <div className="p-4 text-center text-gray-500">
            No notifications
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell; 