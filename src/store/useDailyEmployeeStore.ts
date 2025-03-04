import { create } from 'zustand';
import { 
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { format, startOfDay, endOfDay } from 'date-fns';

interface LocationData {
  address: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy: number;
}

interface RoutineData {
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'leave';
  notes?: string;
}

interface EmployeeDetails {
  name: string;
  email: string;
  designation: string;
  baseSalary: number;
  specialSalary: number;
  epfuanNumber: string;
  esicNumber: string;
}

interface DailyEmployeeData {
  employeeId: string;
  name: string;
  email: string;
  designation: string;
  location?: LocationData;
  routine?: RoutineData;
}

interface DailyEmployeeStore {
  dailyData: DailyEmployeeData[];
  loading: boolean;
  error: string | null;
  fetchTodayEmployeeData: () => Promise<void>;
  clearError: () => void;
}

const useDailyEmployeeStore = create<DailyEmployeeStore>((set) => ({
  dailyData: [],
  loading: false,
  error: null,

  fetchTodayEmployeeData: async () => {
    set({ loading: true, error: null });
    try {
      const today = format(new Date(), 'dd-MM-yyyy');
      const employeesCollectionRef = collection(db, 'employees');
      
      // First, get all employee IDs
      const employeeSnapshots = await getDocs(employeesCollectionRef);
      
      if (employeeSnapshots.empty) {
        set({ 
          dailyData: [], 
          loading: false,
          error: 'No employees found in the database'
        });
        return;
      }

      const todayStart = startOfDay(new Date());
      const todayEnd = endOfDay(new Date());
      
      const dailyDataPromises = employeeSnapshots.docs.map(async (empDoc) => {
        const employeeId = empDoc.id;
        
        try {
          // Fetch employee details from employee_details subcollection
          const employeeDetailsRef = doc(db, `employees/${employeeId}/employee_details/details`);
          const employeeDetailsDoc = await getDoc(employeeDetailsRef);
          
          if (!employeeDetailsDoc.exists()) {
            throw new Error('Employee details not found');
          }
          
          const employeeDetails = employeeDetailsDoc.data() as EmployeeDetails;
          
          // Fetch location data for today
          const locationRef = collection(db, `employees/${employeeId}/daily_data/${today}/location`);
          const locationQuery = query(
            locationRef,
            where('timestamp', '>=', Timestamp.fromDate(todayStart)),
            where('timestamp', '<=', Timestamp.fromDate(todayEnd)),
            orderBy('timestamp', 'desc'),
            limit(1)
          );
          const locationSnapshot = await getDocs(locationQuery);
          
         
          const dailyDataRef = doc(db, `employees/${employeeId}/daily_data/${today}`);
          const dailyDataDoc = await getDoc(dailyDataRef);

         
          
       
          const defaultRoutine: RoutineData = dailyDataDoc.exists() 
            ? { status: 'present', notes: 'Daily data exists' }
            : { status: 'absent', notes: 'No attendance record found' };

          // Fetch routine data for today
          // const routineRef = collection(db, `employees/${employeeId}/daily_data/${today}/routine`);
          // const routineQuery = query(routineRef, limit(1));
          // const routineSnapshot = await getDocs(routineQuery);

          // Combine the data
          return {
            employeeId,
            name: employeeDetails.name,
            email: employeeDetails.email,
            designation: employeeDetails.designation,
            location: locationSnapshot.empty ? undefined : {
              ...locationSnapshot.docs[0].data() as LocationData,
              timestamp: locationSnapshot.docs[0].data().timestamp.toDate().toISOString()
            },
            routine: defaultRoutine
          } as DailyEmployeeData;
          
        } catch (error) {
          console.error(`Error fetching daily data for employee ${employeeId}:`, error);
          // Return a partial record instead of null to maintain employee visibility
          return {
            employeeId,
            name: 'Unknown Employee',
            email: '',
            designation: 'No Designation',
            routine: {
              status: 'absent',
              notes: 'Error fetching employee data'
            }
          } as DailyEmployeeData;
        }
      });

      const dailyData = await Promise.all(dailyDataPromises);
      
      // Sort employees by status: present first, then on leave, then absent
      const sortedDailyData = dailyData.sort((a, b) => {
        const statusOrder = { present: 0, leave: 1, absent: 2 };
        return (
          statusOrder[a.routine?.status || 'absent'] - 
          statusOrder[b.routine?.status || 'absent']
        );
      });

      set({ dailyData: sortedDailyData, loading: false });
      
    } catch (err) {
      console.error('Error in fetchTodayEmployeeData:', err);
      set({ 
        error: err instanceof Error ? err.message : 'Failed to fetch today\'s employee data',
        loading: false,
        dailyData: [] // Clear the data on error
      });
    }
  },

  clearError: () => set({ error: null })
}));

export default useDailyEmployeeStore;