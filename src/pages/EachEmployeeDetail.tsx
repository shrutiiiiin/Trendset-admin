import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import useEmployeeStore, { EmployeeDetails } from '../store/useEmployee';
import {
  Building2, Mail, DollarSign, UserCircle,
  Calendar, MapPin, Clock, ArrowLeft,
  BriefcaseBusiness, CalendarClock, Timer, AlertCircle,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { format, parseISO, formatDistance, isValid } from 'date-fns';
import {
  collection,
  getDocs,
  query,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

interface LocationData {
  address: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy: number;
}

interface RoutineData {
  routines: string[];
  timestamp: string;
}

interface WorkSessionData {
  checkInTime: string | null;
  checkOutTime: string | null;
  createdAt: string | null;
  durationMinutes: number;
}

interface DailyData {
  date: string;
  locations: LocationData[];
  routines: RoutineData[];
  workSessions: WorkSessionData[];
}

const EachEmployeeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { employees, fetchEmployees } = useEmployeeStore();
  const [employee, setEmployee] = useState<EmployeeDetails | null>(null);
  const [dailyDataList, setDailyDataList] = useState<DailyData[]>([]);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const safeConvertTimestamp = (timestamp: any): string | null => {
    if (!timestamp) return null;

    try {
      let date: Date;

      if (timestamp instanceof Timestamp) {
        date = timestamp.toDate();
      } else if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else if (typeof timestamp === 'number') {
        date = new Date(timestamp * 1000);
      } else if (typeof timestamp === 'string') {
        // Check if the string is already in ISO format
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(timestamp)) {
          date = new Date(timestamp);
        } else {
          // Try to parse other date string formats
          date = new Date(timestamp);
        }
      } else if (timestamp.seconds !== undefined) {
        date = new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
      } else {
        return null;
      }

      return isValid(date) ? date.toISOString() : null;
    } catch (err) {
      console.error('Error converting timestamp:', err, timestamp);
      return null;
    }
  };

  const safeFormatDate = (dateString: string | null, formatString: string, fallback: string = 'N/A') => {
    if (!dateString) return fallback;

    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, formatString) : fallback;
    } catch (e) {
      console.error('Error formatting date:', e);
      return fallback;
    }
  };

  const formatDisplayDate = (dateString: string) => {
    try {
      // Assuming input format is DD-MM-YYYY
      const [day, month, year] = dateString.split('-').map(num => num.padStart(2, '0'));
      // Create date in UTC to avoid timezone issues
      const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
      
      if (!isValid(date)) {
        throw new Error('Invalid date');
      }
      
      return format(date, 'dd MMM yyyy');
    } catch (e) {
      console.error('Error formatting display date:', e, dateString);
      return dateString;
    }
  };

  useEffect(() => {
    if (employees.length === 0) {
      fetchEmployees();
    } else {
      const foundEmployee = employees.find(emp => emp.id === id);
      if (foundEmployee) {
        setEmployee(foundEmployee);
      }
    }
  }, [id, employees, fetchEmployees]);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const dailyDataPath = `employees/${id}/daily_data`;
        const dailyCollectionRef = collection(db, dailyDataPath);
        const dailyDataQuery = query(dailyCollectionRef);
        const dailyDataSnapshot = await getDocs(dailyDataQuery);

        const allDailyData: DailyData[] = [];

        for (const dayDoc of dailyDataSnapshot.docs) {
          const date = dayDoc.id;

          // Fetch locations
          const locationsRef = collection(db, `${dailyDataPath}/${date}/location`);
          const locationsSnapshot = await getDocs(locationsRef);
          const locations = locationsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              ...data,
              timestamp: safeConvertTimestamp(data.timestamp) || new Date().toISOString()
            } as LocationData;
          });

          // Fetch routines
          const routinesRef = collection(db, `${dailyDataPath}/${date}/routine`);
          const routinesSnapshot = await getDocs(routinesRef);
          const routines = routinesSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              ...data,
              timestamp: safeConvertTimestamp(data.timestamp) || new Date().toISOString()
            } as RoutineData;
          });

          // Fetch work sessions
          const workSessionsRef = collection(db, `${dailyDataPath}/${date}/work_sessions`);
          const workSessionsSnapshot = await getDocs(workSessionsRef);
          const workSessions = workSessionsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              checkInTime: safeConvertTimestamp(data.checkInTime),
              checkOutTime: safeConvertTimestamp(data.checkOutTime),
              createdAt: safeConvertTimestamp(data.createdAt),
              durationMinutes: data.durationMinutes || 0
            } as WorkSessionData;
          });

          allDailyData.push({
            date,
            locations,
            routines,
            workSessions
          });
        }

        // Sort by date in descending order (most recent first)
        allDailyData.sort((a, b) => {
          const dateA = new Date(a.date.split('-').reverse().join('-'));
          const dateB = new Date(b.date.split('-').reverse().join('-'));
          return dateB.getTime() - dateA.getTime();
        });

        setDailyDataList(allDailyData);

        if (allDailyData.length > 0) {
          setExpandedDay(allDailyData[0].date);
        }

      } catch (err) {
        console.error('Error fetching employee data:', err);
        setError('Failed to load employee data');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, [id]);

  

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl bg-red-50 border border-red-200 rounded-lg p-4 my-8">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <h3 className="text-red-800 font-medium">Error</h3>
        </div>
        <p className="text-red-700 mt-2">{error}</p>
        <button
          className="mt-4 flex items-center text-blue-600 hover:text-blue-800"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Go Back
        </button>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="mx-auto max-w-2xl bg-yellow-50 border border-yellow-200 rounded-lg p-4 my-8">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
          <h3 className="text-yellow-800 font-medium">Employee Not Found</h3>
        </div>
        <p className="text-yellow-700 mt-2">The requested employee could not be found.</p>
        <button
          className="mt-4 flex items-center text-blue-600 hover:text-blue-800"
          onClick={() => navigate('/employees')}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Employees
        </button>
      </div>
    );
  }

  const toggleExpandDay = (date: string) => {
    setExpandedDay(expandedDay === date ? null : date);
  };


  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Navigation */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          <span>Back</span>
        </button>
        <span className="text-gray-400">/</span>
        <span className="text-gray-800 font-medium">{employee.name}</span>
      </div>

      {/* Employee Header Card */}
      <motion.div
        className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="bg-white/20 p-4 rounded-full">
              <UserCircle className="w-16 h-16 text-white" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-bold">{employee.name}</h1>
              <div className="flex items-center justify-center sm:justify-start mt-1 text-white/80">
                <Building2 className="w-4 h-4 mr-2" />
                <span>{employee.designation}</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start mt-1 text-white/80">
                <Mail className="w-4 h-4 mr-2" />
                <span>{employee.email}</span>
              </div>
            </div>
            <div className="ml-auto hidden sm:block text-right">
              <div className="flex items-center text-white/80 justify-end">
                <DollarSign className="w-4 h-4 mr-1" />
                <span className="text-sm">Employee ID:</span>
                <span className="ml-2 font-medium">{employee.employeeId}</span>
              </div>
              <div className="flex items-center text-white/80 justify-end mt-1">
                <Calendar className="w-4 h-4 mr-1" />
                <span className="text-sm">Joined:</span>
                <span className="ml-2 font-medium">
                {employee.createdAt ? 
                  format(
                    typeof employee.createdAt === 'string' 
                      ? parseISO(employee.createdAt)
                      : employee.createdAt.toDate(), 
                    'dd MMM yyyy'
                  ) 
                  : 'N/A'
                }
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-3 text-gray-800">Salary Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-sm text-gray-500">Base Salary</span>
                <div className="font-semibold text-gray-800 flex items-center mt-1">
                  <DollarSign className="w-4 h-4 text-green-500 mr-1" />
                  ₹{employee.baseSalary?.toLocaleString() || 'N/A'}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-sm text-gray-500">Special Allowance</span>
                <div className="font-semibold text-gray-800 flex items-center mt-1">
                  <DollarSign className="w-4 h-4 text-green-500 mr-1" />
                  ₹{employee.specialSalary?.toLocaleString() || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3 text-gray-800">Employee Numbers</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-sm text-gray-500">EPF UAN</span>
                <div className="font-semibold text-gray-800 mt-1">
                  {employee.epfuanNumber || 'Not Available'}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-sm text-gray-500">ESIC Number</span>
                <div className="font-semibold text-gray-800 mt-1">
                  {employee.esicNumber || 'Not Available'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Employee Activity History */}
      <motion.div
        className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="border-b p-6">
          <h2 className="text-xl font-bold text-gray-800">Activity History</h2>
        </div>

        {dailyDataList.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-gray-500 italic">No activity data available for this employee</div>
          </div>
        ) : (
          <div className="divide-y">
            {dailyDataList.map((dailyData, dayIndex) => (
              <div key={dayIndex} className="transition-colors">
                <div
                  className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleExpandDay(dailyData.date)}
                >
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-blue-500 mr-3" />
                    <div className="font-medium text-gray-800">{formatDisplayDate(dailyData.date)}</div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-blue-400" />
                      <span>{dailyData.locations.length}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <BriefcaseBusiness className="w-4 h-4 text-purple-400" />
                      <span>{dailyData.routines.length}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <CalendarClock className="w-4 h-4 text-green-400" />
                      <span>{dailyData.workSessions.length}</span>
                    </div>
                    {expandedDay === dailyData.date ?
                      <ChevronUp className="w-5 h-5 text-gray-400" /> :
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    }
                  </div>
                </div>

                {expandedDay === dailyData.date && (
                  <div className="p-6 pt-0 grid grid-cols-1 lg:grid-cols-3 gap-6 bg-gray-50">
                    {/* Location Section */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 text-gray-800 mb-4">
                        <MapPin className="w-5 h-5 text-blue-500" />
                        <h3 className="font-semibold">Location Check-ins</h3>
                      </div>

                      {dailyData.locations.length > 0 ? (
                        <div className="space-y-4">
                          {dailyData.locations.map((location, index) => (
                            <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                              <div className="text-gray-800 font-medium line-clamp-2">{location.address}</div>
                              <div className="flex items-center text-gray-600 mt-2 text-sm">
                                <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                {safeFormatDate(location.timestamp, 'hh:mm a')}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-white rounded-lg p-4 text-gray-500 text-sm italic border border-gray-200">
                          No location check-ins recorded
                        </div>
                      )}
                    </div>

                    {/* Routines Section */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 text-gray-800 mb-4">
                        <BriefcaseBusiness className="w-5 h-5 text-purple-500" />
                        <h3 className="font-semibold">Routines</h3>
                      </div>

                      {dailyData.routines.length > 0 ? (
                        <div className="space-y-4">
                          {dailyData.routines.map((routine, index) => (
                            <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                              <ul className="list-disc list-inside space-y-1">
                                {routine.routines.map((r, i) => (
                                  <li key={i} className="text-gray-800">{r}</li>
                                ))}
                              </ul>
                              <div className="flex items-center text-gray-600 mt-2 text-sm">
                                <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                {safeFormatDate(routine.timestamp, 'hh:mm a')}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-white rounded-lg p-4 text-gray-500 text-sm italic border border-gray-200">
                          No routines recorded
                        </div>
                      )}
                    </div>

                    {/* Work Sessions Section */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 text-gray-800 mb-4">
                        <CalendarClock className="w-5 h-5 text-green-500" />
                        <h3 className="font-semibold">Work Sessions</h3>
                      </div>

                      {dailyData.workSessions.length > 0 ? (
                        <div className="space-y-4">
                          {dailyData.workSessions.map((session, index) => {
                            // Safe check for valid dates and duration calculation
                            const checkInTime = safeFormatDate(session.checkInTime, 'hh:mm a', 'N/A');
                            let checkOutTime = 'In progress';
                            let duration = 'In progress';

                            if (session.checkOutTime) {
                              checkOutTime = safeFormatDate(session.checkOutTime, 'hh:mm a', 'N/A');

                              if (session.checkInTime && session.checkOutTime &&
                                checkInTime !== 'N/A' && checkOutTime !== 'N/A') {
                                try {
                                  const inDate = parseISO(session.checkInTime);
                                  const outDate = parseISO(session.checkOutTime);
                                  if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) {
                                    throw new Error('Invalid date');
                                  }
                                  duration = session.durationMinutes > 0
                                    ? `${session.durationMinutes} minutes`
                                    : formatDistance(inDate, outDate, { addSuffix: false });
                                } catch (err) {
                                  console.error('Error calculating duration:', err);
                                  duration = 'N/A';
                                }
                              } else {
                                duration = 'N/A';
                              }
                            }

                            return (
                              <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <div className="text-gray-500">Check In</div>
                                    <div className="font-medium">{checkInTime}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-500">Check Out</div>
                                    <div className="font-medium">{checkOutTime}</div>
                                  </div>
                                </div>
                                <div className="flex items-center mt-3 text-gray-700">
                                  <Timer className="w-4 h-4 mr-2 text-gray-400" />
                                  <span className="font-medium">{duration}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="bg-white rounded-lg p-4 text-gray-500 text-sm italic border border-gray-200">
                          No work sessions recorded
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default EachEmployeeDetail;