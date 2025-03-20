import { create } from 'zustand';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  query,
  getDoc,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { format } from 'date-fns';
import { calculatePayroll } from '@/components/PayrollLayout';

interface LocationData {
  address: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy: number;
}
interface PayrollWithId extends PayrollDetails {
  id: string;
}
export interface PayrollCalculationInput {
  workingDays: string;
  reportedDays: string;
  basic: string;
  specialPay: string;
  advance: string;
  tds: string;
  providentFund: string;
  medicalContribution: string;
}

export interface EmployeeDetails {
  id: string;
  employeeId: string;
  createdAt: Timestamp | null;
  name: string;
  email: string;
  designation: string;
  baseSalary: number;
  specialSalary: number;
  epfuanNumber: string;
  esicNumber: string;
  dateOfJoining: string;
  password: string;
  todayLocation?: LocationData;
}

export interface PayrollDetails {
  
  employeeId: string;
  month: string; // Format: "MM-YYYY"
  workingDays: string;
  reportedDays: string;
  basic: string;
  da: string;
  hra: string;
  specialPay: string;
  grossEarning: string;
  payScale: string;
  esic:string;
  providentFund: string;
  professional: string;
  advance: string;
  tds: string;
  totalDeductions: string;
  netPay: string;
  cpf: string;
  esicContribution: string;
  medicalContribution: string;
  createdAt: Timestamp;
}

type NewEmployeeData = Omit<EmployeeDetails, 'id' | 'todayLocation'>;

interface EmployeeStore {
  employees: EmployeeDetails[];
  payrolls: PayrollWithId[];
  loading: boolean;
  error: string | null;
  deleteOldPayrolls: (olderThanMonths: number) => Promise<void>;
  fetchEmployees: () => Promise<void>;
  fetchTodayLocation: (employeeId: string) => Promise<LocationData | undefined>;
  fetchPayrollsForMonth: (month: string) => Promise<void>;
  fetchPayrollDetails: (employeeId: string, month?: string) => Promise<void>;
  addEmployee: (employeeData: NewEmployeeData) => Promise<void>;
  updateEmployee: (id: string, employeeData: Partial<EmployeeDetails>) => Promise<void>;
  updatePayroll: (employeeId: string, payrollData: Omit<PayrollDetails, 'createdAt'>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  clearError: () => void;
}

const useEmployeeStore = create<EmployeeStore>((set, get) => ({
  employees: [],
  payrolls: [],
  loading: false,
  error: null,

  deleteOldPayrolls: async (olderThanMonths: number) => {
    set({ loading: true, error: null });
    try {
     
      const currentDate = new Date();
      const cutoffDate = new Date(currentDate);
      cutoffDate.setMonth(cutoffDate.getMonth() - olderThanMonths);
      
     
      const cutoffMonth = format(cutoffDate, 'MM-yyyy');
      
     
      const employeesCollectionRef = collection(db, 'employees');
      const employeeSnapshots = await getDocs(employeesCollectionRef);
      
   
      let totalDeleted = 0;
      let employeesProcessed = 0;
      
      // Process each employee
      for (const employeeDoc of employeeSnapshots.docs) {
        const employeeId = employeeDoc.id;
        employeesProcessed++;
        
        // Get all payroll records for this employee
        const payrollRef = collection(db, `employees/${employeeId}/payroll`);
        const payrollSnapshot = await getDocs(payrollRef);
        
        const deletionPromises = [];
        
        for (const payrollDoc of payrollSnapshot.docs) {
          const payrollData = payrollDoc.data() as PayrollDetails;
          const payrollMonth = payrollData.month; // Format: MM-YYYY
          
          if (payrollMonth < cutoffMonth) {
            deletionPromises.push(deleteDoc(payrollDoc.ref));
            totalDeleted++;
          }
        }
        
        if (deletionPromises.length > 0) {
          await Promise.all(deletionPromises);
        }
      }
      
      console.log(`Payroll cleanup completed: ${totalDeleted} old payrolls deleted across ${employeesProcessed} employees`);
      
      // After deletion, refresh the current payroll data if needed
      const currentMonthFormatted = format(new Date(), 'MM-yyyy');
      await get().fetchPayrollsForMonth(currentMonthFormatted);
      
      set({ loading: false });
    } catch (err) {
      console.error('Error deleting old payrolls:', err);
      set({
        error: err instanceof Error ? err.message : 'Failed to delete old payrolls',
        loading: false,
      });
    }
  },

  fetchTodayLocation: async (employeeId: string) => {
    try {
      const today = format(new Date(), 'dd-MM-yyyy');
      const locationRef = collection(db, `employees/${employeeId}/daily_data/${today}/location`);
      const locationQuery = query(locationRef, orderBy('timestamp', 'desc'), firestoreLimit(1));
      const locationSnapshot = await getDocs(locationQuery);

      if (!locationSnapshot.empty) {
        return locationSnapshot.docs[0].data() as LocationData;
      }
      return undefined;
    } catch (err) {
      console.error('Failed to fetch today\'s location:', err);
      return undefined;
    }
  },

  fetchPayrollsForMonth: async (month: string) => {
    set({ loading: true, error: null });
    try {
      const employees = get().employees;
      
      // First, fetch the basic payroll data
      const payrollDataPromises = employees.map(async (emp) => {
        const payrollDocRef = doc(db, `employees/${emp.id}/payroll`, month);
        const payrollDoc = await getDoc(payrollDocRef);
        
        // Get the employee details to access the salary information
        const employeeDetailsRef = doc(db, `employees/${emp.id}/employee_details`, 'details');
        const employeeDetailsDoc = await getDoc(employeeDetailsRef);
        
        let baseSalary = "0";
        let specialSalary = "0";
        
        if (employeeDetailsDoc.exists()) {
          const details = employeeDetailsDoc.data();
          baseSalary = details.baseSalary ? details.baseSalary.toString() : "0";
          specialSalary = details.specialSalary ? details.specialSalary.toString() : "0";
        }
        
        if (payrollDoc.exists()) {
          const payrollData = payrollDoc.data() as PayrollDetails;
          return {
            id: payrollDoc.id,
            ...payrollData,
            employeeId: emp.id,
            // Update with the latest salary information
            basic: baseSalary,
            specialPay: specialSalary
          };
        }
        return null;
      });
      
      let payrollData = (await Promise.all(payrollDataPromises))
        .filter((data): data is PayrollWithId => data !== null);
      
      // Parse the month and year from the month parameter
      const [monthStr, yearStr] = month.split('-');
      
      // Now enhance the payroll data with attendance information
      const updatedPayrollPromises = payrollData.map(async (payroll) => {
        // Get all documents in the daily_data collection for this employee
        const dailyDataRef = collection(db, 'employees', payroll.employeeId, 'daily_data');
        const querySnapshot = await getDocs(dailyDataRef);
        
        // Count documents that match the current month
        let attendanceDays = 0;
        
        querySnapshot.forEach((doc) => {
          // Document ID is in format "DD-MM-YYYY"
          const docId = doc.id;
          const dateParts = docId.split('-');
          
          // Check if it's a valid date format
          if (dateParts.length === 3) {
            const docMonth = dateParts[1]; // Month part (MM)
            const docYear = dateParts[2];  // Year part (YYYY)
            
            // If the document is for the current month/year
            if (docMonth === monthStr && docYear === yearStr) {
              attendanceDays++;
            }
          }
        });
        
        console.log(`Employee ${payroll.employeeId} has ${attendanceDays} present days in ${monthStr}-${yearStr}`);
        
        // Create a calculation input object with just the fields needed for calculation
        const calculationInput: PayrollCalculationInput = {
          workingDays: payroll.workingDays,
          reportedDays: attendanceDays.toString(),
          basic: payroll.basic,
          specialPay: payroll.specialPay,
          advance: payroll.advance,
          tds: payroll.tds,
          providentFund: payroll.providentFund,
          medicalContribution: payroll.medicalContribution
        };
        
        // Recalculate payroll based on new attendance and salary information
        const calculations = calculatePayroll(calculationInput);
        console.log('Payroll calculations:', calculations);
        
        // Create the updated payroll object
        const updatedPayroll = {
          ...payroll,
          reportedDays: attendanceDays.toString(),
          ...calculations
        };
        
        // Update the payroll record in Firestore
        const payrollRef = doc(db, `employees/${payroll.employeeId}/payroll`, month);
        await setDoc(payrollRef, {
          ...updatedPayroll,
          createdAt: payroll.createdAt // Keep the original creation timestamp
        }, { merge: true });
        
        return updatedPayroll;
      });
      
      // Type assertion to ensure TypeScript knows the result is PayrollWithId[]
      const updatedPayrollData = await Promise.all(updatedPayrollPromises) as PayrollWithId[];
      
      console.log('Updated payroll data:', updatedPayrollData);
      
      // Update the state with the enhanced payroll data
      set({ payrolls: updatedPayrollData, loading: false });
      
    } catch (err) {
      console.error('Error fetching payrolls for month:', err);
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch payrolls',
        loading: false,
      });
    }
  },

  fetchEmployees: async () => {
    set({ loading: true, error: null });
    try {
      const employeesCollectionRef = collection(db, 'employees');
      const employeeSnapshots = await getDocs(employeesCollectionRef);

      const employeePromises = employeeSnapshots.docs.map(async (empDoc) => {
        const employeeId = empDoc.id;
        const detailsRef = doc(db, `employees/${employeeId}/employee_details`, 'details');
        const detailsSnapshot = await getDoc(detailsRef);

        if (detailsSnapshot.exists()) {
          const employeeData = detailsSnapshot.data();
          const todayLocation = await get().fetchTodayLocation(employeeId);

          const employee: EmployeeDetails = {
            id: employeeId,
            employeeId: employeeData.employeeId || employeeId,
            dateOfJoining: employeeData.dateOfJoining || '',
            createdAt: employeeData.createdAt || null,
            name: employeeData.name || '',
            email: employeeData.email || '',
            designation: employeeData.designation || '',
            baseSalary: employeeData.baseSalary || 0,
            specialSalary: employeeData.specialSalary || 0,
            epfuanNumber: employeeData.epfuanNumber || '',
            esicNumber: employeeData.esicNumber || '',
            password: employeeData.password || '',
            todayLocation,
          };
          return employee;
        } else {
          console.error(`Details not found for employee ${employeeId}`);
          return null;
        }
      });

      const employeeData = (await Promise.all(employeePromises)).filter(
        (employee): employee is EmployeeDetails => employee !== null
      );

      set({ employees: employeeData, loading: false });
    } catch (err) {
      console.error('Error in fetchEmployees:', err);
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch employees',
        loading: false,
      });
    }
  },

  fetchPayrollDetails: async (employeeId: string, month?: string) => {
    set({ loading: true, error: null });
    try {
      const payrollRef = collection(db, `employees/${employeeId}/payroll`);
      let payrollQuery;

      if (month) {
        payrollQuery = query(payrollRef, where('month', '==', month));
      } else {
        payrollQuery = query(payrollRef, orderBy('month', 'desc'));
      }

      const payrollSnapshot = await getDocs(payrollQuery);
      const payrollData = payrollSnapshot.docs.map(doc => ({
        ...doc.data() as PayrollDetails,
        id: doc.id,
      }));
      console.log('Payroll data:', payrollData);

      set(() => ({
        payrolls: payrollData,
        loading: false,
      }));
    } catch (err) {
      console.error('Error fetching payroll details:', err);
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch payroll details',
        loading: false,
      });
    }
  },

  addEmployee: async (employeeData: NewEmployeeData) => {
    set({ loading: true, error: null });
    try {
      const employeeRef = doc(db, 'employees', employeeData.employeeId);
      const detailsRef = doc(employeeRef, 'employee_details', 'details');

      await setDoc(employeeRef, {
        employeeId: employeeData.employeeId,
        createdAt: Timestamp.now(),
      });

      await setDoc(detailsRef, {
        ...employeeData,
        createdAt: Timestamp.now(),
      });

      const newEmployee: EmployeeDetails = {
        id: employeeData.employeeId,
        ...employeeData,
        createdAt: Timestamp.now(),
      };

      set((state) => ({
        employees: [...state.employees, newEmployee],
        loading: false,
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to add employee',
        loading: false,
      });
    }
  },

  updateEmployee: async (id: string, employeeData: Partial<EmployeeDetails>) => {
    set({ loading: true, error: null });
    try {
      const employeeDetailsToUpdate = {
        ...(employeeData.name !== undefined && { name: employeeData.name }),
        ...(employeeData.email !== undefined && { email: employeeData.email }),
        ...(employeeData.designation !== undefined && { designation: employeeData.designation }),
        ...(employeeData.baseSalary !== undefined && { baseSalary: employeeData.baseSalary }),
        ...(employeeData.specialSalary !== undefined && { specialSalary: employeeData.specialSalary }),
        ...(employeeData.epfuanNumber !== undefined && { epfuanNumber: employeeData.epfuanNumber }),
        ...(employeeData.esicNumber !== undefined && { esicNumber: employeeData.esicNumber }),
        ...(employeeData.dateOfJoining !== undefined && { dateOfJoining: employeeData.dateOfJoining }),
        ...(employeeData.password !== undefined && { password: employeeData.password }),
      };

      if (Object.keys(employeeDetailsToUpdate).length > 0) {
        const employeeRef = doc(db, 'employees', id, 'employee_details', 'details');
        await setDoc(employeeRef, employeeDetailsToUpdate, { merge: true });
      }

      set((state) => ({
        employees: state.employees.map((emp) =>
          emp.id === id ? { ...emp, ...employeeDetailsToUpdate } : emp
        ),
        loading: false,
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to update employee',
        loading: false,
      });
    }
  },

  updatePayroll: async (employeeId: string, payrollData: Omit<PayrollDetails, 'createdAt'>) => {
    set({ loading: true, error: null });
    try {
      const { month } = payrollData;

      if (!month) {
        throw new Error('Month is required for payroll data');
      }

      const payrollRef = doc(db, `employees/${employeeId}/payroll`, month);
      const payrollWithTimestamp: PayrollDetails = {
        ...payrollData,
        employeeId,
        createdAt: Timestamp.now(),
      };

      await setDoc(payrollRef, payrollWithTimestamp, { merge: true });

      // Optionally fetch updated payroll data
      await get().fetchPayrollsForMonth(month);
      set({ loading: false });
    } catch (err) {
      console.error('Error updating payroll:', err);
      set({
        error: err instanceof Error ? err.message : 'Failed to update payroll data',
        loading: false,
      });
    }
  },

  deleteEmployee: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const employeeRef = doc(db, 'employees', id);
      await deleteDoc(employeeRef);

      // Delete payroll subcollection
      const payrollRef = collection(db, `employees/${id}/payroll`);
      const payrollSnapshot = await getDocs(payrollRef);
      const deletionPromises = payrollSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletionPromises);

      set(state => ({
        employees: state.employees.filter(emp => emp.id !== id),
        payrolls: state.payrolls.filter(p => p.employeeId !== id),
        loading: false,
      }));
    } catch (err) {
      console.error('Error deleting employee:', err);
      set({
        error: err instanceof Error ? err.message : 'Failed to delete employee',
        loading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useEmployeeStore;