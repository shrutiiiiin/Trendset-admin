import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { 
  Users, 
  Clock,  
  Bell, 
  UserCircle, 
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Trash2
} from 'lucide-react';
import EmployeeDashboard from './EmployeeDashboard';
import useDailyEmployeeStore from '../store/useDailyEmployeeStore';
import { format } from 'date-fns';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '../config/firebase';

interface Announcement {
  id: string;
  content: string;
  date: string;
  author: string;
  timestamp: number;
}

const Dashboard = () => {
  const [activePage] = useState('Dashboard');
  const { dailyData, loading, fetchTodayEmployeeData } = useDailyEmployeeStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [isAdmin] = useState(true); 
  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false);

  useEffect(() => {
    fetchTodayEmployeeData();
    // Refresh data every 5 minutes
    const interval = setInterval(fetchTodayEmployeeData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoadingAnnouncements(true);
        const announcementsRef = collection(db, 'announcements');
        const q = query(announcementsRef, orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const fetchedAnnouncements: Announcement[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedAnnouncements.push({
            id: doc.id,
            content: data.content,
            date: data.date,
            author: data.author,
            timestamp: data.timestamp
          });
        });
        
        setAnnouncements(fetchedAnnouncements);
      } catch (error) {
        console.error("Error fetching announcements:", error);
      } finally {
        setLoadingAnnouncements(false);
      }
    };

    fetchAnnouncements();
  }, []);

  // Add new announcement
  const handleAddAnnouncement = async () => {
    if (!newAnnouncement.trim()) return;
    
    try {
      const today = new Date();
      const dateString = today.toISOString().split('T')[0];
      
      const announcementData = {
        content: newAnnouncement,
        date: dateString,
        author: "Admin",
        timestamp: Date.now()
      };
      
      // Add to main announcements collection
      const announcementRef = collection(db, 'announcements');
      const docRef = await addDoc(announcementRef, announcementData);
      
      // Update state with new announcement
      const newAnnouncementObj: Announcement = {
        id: docRef.id,
        ...announcementData
      };
      
      setAnnouncements([newAnnouncementObj, ...announcements]);
      setNewAnnouncement("");
    } catch (error) {
      console.error("Error adding announcement:", error);
      alert("Failed to add announcement. Please try again.");
    }
  };

  // Delete announcement
  const handleDeleteAnnouncement = async (id: string) => {
    try {
      // Delete from Firestore
      const announcementRef = doc(db, "announcements", id);
      await deleteDoc(announcementRef);
      
      // Update local state
      setAnnouncements(announcements.filter(announcement => 
        announcement.id !== id
      ));
    } catch (error) {
      console.error("Error deleting announcement:", error);
      alert("Failed to delete announcement. Please try again.");
    }
  };

  const calculateStatistics = () => {
    const present = dailyData.filter(emp => emp.routine?.status === 'present').length;
    const onLeave = dailyData.filter(emp => emp.routine?.status === 'leave').length;
    const absent = dailyData.filter(emp => emp.routine?.status === 'absent').length;
    const checkedIn = dailyData.filter(emp => emp.routine?.checkIn).length;
    const checkedOut = dailyData.filter(emp => emp.routine?.checkOut).length;

    return {
      present,
      onLeave,
      absent,
      checkedIn,
      checkedOut
    };
  };

  // Determine which announcements to display
  const displayAnnouncements = showAllAnnouncements 
    ? announcements 
    : announcements.slice(0, 2);

  const stats = calculateStatistics();
  const getStatusDisplay = (status: string | undefined) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const renderContent = () => {
    if (activePage === 'Employees') {
      return <EmployeeDashboard />;
    }

    return (
      <div className="p-6 space-y-8">
        {/* Date Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-medium">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </h2>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 bg-white">
            <div className="flex flex-col items-center">
              <div className="text-blue-500 mb-2">
                <Users className="w-8 h-8" />
              </div>
              <p className="text-3xl font-bold mb-1">{dailyData.length}</p>
              <p className="text-sm text-gray-500">Total Employees</p>
            </div>
          </Card>

          <Card className="p-6 bg-white">
            <div className="flex flex-col items-center">
              <div className="text-green-500 mb-2">
                <CheckCircle className="w-8 h-8" />
              </div>
              <p className="text-3xl font-bold mb-1">{stats.present}</p>
              <p className="text-sm text-gray-500">Present Today</p>
            </div>
          </Card>

          <Card className="p-6 bg-white">
            <div className="flex flex-col items-center">
              <div className="text-yellow-500 mb-2">
                <Clock className="w-8 h-8" />
              </div>
              <p className="text-3xl font-bold mb-1">{stats.onLeave}</p>
              <p className="text-sm text-gray-500">On Leave</p>
            </div>
          </Card>

          <Card className="p-6 bg-white">
            <div className="flex flex-col items-center">
              <div className="text-red-500 mb-2">
                <XCircle className="w-8 h-8" />
              </div>
              <p className="text-3xl font-bold mb-1">{stats.absent}</p>
              <p className="text-sm text-gray-500">Absent</p>
            </div>
          </Card>
        </div>
        
        {/* Announcements Section */}
        <Card className="bg-white rounded-lg shadow">
          <div className="p-6 border-b flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold flex items-center">
                <Bell className="w-5 h-5 text-indigo-500 mr-2" />
                Announcements
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Important updates and notifications
              </p>
            </div>
            {announcements.length > 2 && (
              <button 
                onClick={() => setShowAllAnnouncements(!showAllAnnouncements)}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                {showAllAnnouncements ? "Show Less" : `View all (${announcements.length})`}
              </button>
            )}
          </div>
          
          <div className="p-6">
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
              </div>
            )}
            
            {/* Announcements list */}
            <div className="space-y-4">
              {loadingAnnouncements ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                </div>
              ) : displayAnnouncements.length > 0 ? (
                displayAnnouncements.map((announcement) => (
                  <div 
                    key={announcement.id} 
                    className="border-l-4 border-indigo-500 pl-4 py-2 relative"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-800 font-medium">
                          {announcement.content}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <div className="text-right mr-3">
                          <p className="text-sm text-gray-500">{announcement.date}</p>
                          <p className="text-xs text-gray-400">{announcement.author}</p>
                        </div>
                        {isAdmin && (
                          <button 
                            onClick={() => handleDeleteAnnouncement(announcement.id)}
                            className="text-red-400 hover:text-red-600"
                            title="Delete announcement"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic">No announcements yet</p>
              )}
            </div>
          </div>
        </Card>

        {/* Today's Activity Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Today's Employee Activity</h2>
            <p className="text-sm text-gray-500 mt-1">
              Real-time overview of employee attendance and location
            </p>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : dailyData.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No Activity Yet</h3>
                <p className="text-gray-500">No employee data available for today</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dailyData.map((employee) => (
                  <Card key={employee.employeeId} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <UserCircle className="w-6 h-6 text-gray-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{employee.name}</h3>
                          <p className="text-sm text-gray-600">{employee.designation}</p>
                          <p className="text-sm text-gray-500">{employee.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${employee.routine?.status === 'present' ? 'bg-green-100 text-green-800' : 
                            employee.routine?.status === 'leave' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'}`}>
                          {getStatusDisplay(employee.routine?.status)}
                        </span>
                        {employee.routine?.checkIn && (
                          <p className="text-sm text-gray-600 mt-1">
                            Check-in: {format(new Date(employee.routine.checkIn), 'HH:mm')}
                          </p>
                        )}
                        {employee.routine?.checkOut && (
                          <p className="text-sm text-gray-600">
                            Check-out: {format(new Date(employee.routine.checkOut), 'HH:mm')}
                          </p>
                        )}
                      </div>
                    </div>
                    {employee.location && (
                      <div className="mt-3 flex items-start gap-1.5 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{employee.location.address}</span>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="bg-white p-4 flex justify-between items-center border-b">
          <h1 className="text-xl font-semibold">{activePage}</h1>
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-gray-100 rounded-full relative">
              <Bell className="w-6 h-6 text-gray-600" />
              {announcements.length > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {announcements.length > 9 ? '9+' : announcements.length}
                </span>
              )}
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <UserCircle className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;