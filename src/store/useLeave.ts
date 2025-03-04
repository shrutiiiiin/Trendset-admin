import { create } from 'zustand';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

interface LeaveRequest {
  id: string;
  employeeId: string;
  cause: string;
  duration: number;
  endDate: string;
  leaveType: string;
  startDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
    submittedAt: string;
}

interface LeaveStore {
  leaveRequests: LeaveRequest[];
  loading: boolean;
  error: string | null;
  fetchLeaveRequests: () => Promise<void>;
  updateLeaveStatus: (employeeId: string, leaveId: string, status: 'Approved' | 'Rejected') => Promise<void>;
  clearError: () => void;
}

const useLeaveStore = create<LeaveStore>((set, get) => ({
  leaveRequests: [],
  loading: false,
  error: null,

  fetchLeaveRequests: async () => {
    set({ loading: true, error: null });
    try {
      const employeesCollectionRef = collection(db, 'employees');
      const employeeSnapshots = await getDocs(employeesCollectionRef);

      const leaveRequests: LeaveRequest[] = [];

      for (const empDoc of employeeSnapshots.docs) {
        const employeeId = empDoc.id;
        const leavesCollectionRef = collection(db, `employees/${employeeId}/leaves`);
        const leavesQuery = query(leavesCollectionRef, where('status', '==', 'Pending'));
        const leaveSnapshots = await getDocs(leavesQuery);

        leaveSnapshots.forEach((leaveDoc) => {
          const leaveData = leaveDoc.data();
          leaveRequests.push({
            id: leaveDoc.id,
            employeeId,
            cause: leaveData.cause,
            duration: leaveData.duration,
            endDate: leaveData.endDate ? leaveData.endDate.toDate().toISOString().split('T')[0] : '', 
            leaveType: leaveData.leaveType,
            startDate: leaveData.startDate ? leaveData.startDate.toDate().toISOString().split('T')[0] : '',
            status: leaveData.status,
            submittedAt: leaveData.submittedAt ? leaveData.submittedAt.toDate().toISOString().split('T')[0] : '',
          });
        });
        
      }

      set({ leaveRequests, loading: false });
    } catch (err) {
      console.error('Error in fetchLeaveRequests:', err);
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch leave requests',
        loading: false,
      });
    }
  },

  updateLeaveStatus: async (employeeId: string, leaveId: string, status: 'Approved' | 'Rejected') => {
    set({ loading: true, error: null });
    try {
      const leaveDocRef = doc(db, `employees/${employeeId}/leaves/${leaveId}`);
      await updateDoc(leaveDocRef, { status });

      // Update the local state
      const updatedLeaveRequests = get().leaveRequests.map((request) =>
        request.id === leaveId && request.employeeId === employeeId
          ? { ...request, status }
          : request
      );

      set({ leaveRequests: updatedLeaveRequests, loading: false });
    } catch (err) {
      console.error('Error in updateLeaveStatus:', err);
      set({
        error: err instanceof Error ? err.message : 'Failed to update leave status',
        loading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useLeaveStore;