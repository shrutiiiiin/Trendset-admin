import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Users, Clock, Bell } from 'lucide-react';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

interface DashboardStatsProps {
  employeeCount: number;
  isAdmin: boolean;
}

interface Announcement {
  id: string;
  content: string;
  date: string;
  author: string;
  timestamp: number;
  seen: boolean;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ employeeCount, isAdmin = false }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch real announcements from Firestore
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const announcementsRef = collection(db, 'announcements');
        const q = query(announcementsRef, orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const fetchedAnnouncements: Announcement[] = [];
        querySnapshot.forEach((doc) => {
          fetchedAnnouncements.push({
            id: doc.id,
            ...doc.data() as Omit<Announcement, 'id'>
          });
        });
        
        setAnnouncements(fetchedAnnouncements);
      } catch (error) {
        console.error("Error fetching announcements:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  // Function to add a new announcement to Firestore
  const handleAddAnnouncement = async () => {
    if (!newAnnouncement.trim()) return;
  
    try {
      const today = new Date();
      const dateString = today.toISOString().split('T')[0];
  
      const announcementData = {
        content: newAnnouncement,
        date: dateString,
        author: "Admin",
        timestamp: Date.now(),
        seen: false, // Default to false
      };
  
      const announcementRef = collection(db, "announcements");
      const docRef = await addDoc(announcementRef, announcementData);
  
      const newAnnouncementObj: Announcement = {
        id: docRef.id,
        ...announcementData,
      };
  
      setAnnouncements([newAnnouncementObj, ...announcements]);
      setNewAnnouncement("");
    } catch (error) {
      console.error("Error adding announcement:", error);
      alert("Failed to add announcement. Please try again.");
    }
  };
  

  return (
    <div className="p-6">
      <div className="grid grid-cols-4 gap-6 mb-8">
        <Card className="p-6 bg-white">
          <div className="flex flex-col items-center">
            <div className="text-yellow-500 mb-2">
              <Users className="w-8 h-8" />
            </div>
            <p className="text-3xl font-bold mb-1">{employeeCount}</p>
            <p className="text-sm text-gray-500">No. of Emp</p>
          </div>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex flex-col items-center">
            <div className="text-blue-500 mb-2">
              <Clock className="w-8 h-8" />
            </div>
            <p className="text-3xl font-bold mb-1">10</p>
            <p className="text-sm text-gray-500">Checked In</p>
          </div>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex flex-col items-center">
            <div className="text-green-500 mb-2">
              <Clock className="w-8 h-8" />
            </div>
            <p className="text-3xl font-bold mb-1">0</p>
            <p className="text-sm text-gray-500">On Leave</p>
          </div>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex flex-col items-center">
            <div className="text-red-500 mb-2">
              <Clock className="w-8 h-8" />
            </div>
            <p className="text-3xl font-bold mb-1">3</p>
            <p className="text-sm text-gray-500">Checked Out</p>
          </div>
        </Card>
      </div>
      
      {/* Announcements Section */}
      <Card className="bg-white p-6 mb-8">
        <div className="flex items-center mb-4">
          <Bell className="w-6 h-6 text-indigo-500 mr-2" />
          <h2 className="text-xl font-semibold">Announcements</h2>
        </div>
        
        {/* Admin announcement form */}
        {isAdmin && (
          <div className="mb-6">
            <div className="flex">
              <input
                type="text"
                value={newAnnouncement}
                onChange={(e) => setNewAnnouncement(e.target.value)}
                placeholder="Add a new announcement..."
                className="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleAddAnnouncement}
                className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Post
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Announcements will be stored by date in the announcements collection
            </p>
          </div>
        )}
        
        {/* Announcements list */}
        <div className="space-y-4">
          {loading ? (
            <p className="text-gray-500">Loading announcements...</p>
          ) : announcements.length > 0 ? (
            announcements.map((announcement) => (
              <div key={announcement.id} className="border-l-4 border-indigo-500 pl-4 py-2">
                <div className="flex justify-between items-start">
                  <p className="text-gray-800">{announcement.content}</p>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{announcement.date}</p>
                    <p className="text-xs text-gray-400">{announcement.author}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic">No announcements yet</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default DashboardStats;