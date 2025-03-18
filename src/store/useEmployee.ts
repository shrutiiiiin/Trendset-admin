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

interface LocationData {
  address: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy: number;
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
  payrolls: PayrollDetails[];
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
     
      const payrollRef = collection(db, 'payrolls');
      const q = query(payrollRef, where('month', '==', month));
      const payrollSnapshot = await getDocs(q);
      const payrollData = payrollSnapshot.docs.map(doc => ({
        ...doc.data() as PayrollDetails,
        id: doc.id,
      }));
      console.log('Payroll data for month:', payrollData);
      set({ payrolls: payrollData, loading: false });
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
      await get().fetchPayrollDetails(employeeId);
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