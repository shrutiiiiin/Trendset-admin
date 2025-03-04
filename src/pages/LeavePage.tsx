import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useLeaveStore from '../store/useLeave';
import {
  Calendar,
  Clock,
  AlertCircle,
  Search,
  XCircle,
  CheckCircle,
  Filter,
  UserCircle,
  FileText,
  Menu,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import EmployeeLeaveAnalytics from './EmployeeLeaveAnalytics';

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

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Approved':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'Rejected':
      return <XCircle className="w-5 h-5 text-red-500" />;
    default:
      return <Clock className="w-5 h-5 text-yellow-500" />;
  }
};

const LeaveCard = ({ 
  request,
  onApprove,
  onReject 
}: { 
  request: LeaveRequest,
  onApprove: (employeeId: string, leaveId: string) => void,
  onReject: (employeeId: string, leaveId: string) => void
}) => {
  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{
        scale: 1.02,
        boxShadow: '0 10px 15px rgba(0,0,0,0.1)'
      }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#154699] to-blue-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <UserCircle className="w-10 h-10 text-white/80" />
            <div>
              <h3 className="font-semibold text-lg">Employee ID: {request.employeeId}</h3>
              <div className="flex items-center text-sm text-white/70 space-x-2">
                <FileText className="w-4 h-4" />
                <span>Request ID: {request.id.substring(0, 8)}...</span>
              </div>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${
            request.status === 'Approved' ? 'bg-green-200 text-green-800' :
            request.status === 'Rejected' ? 'bg-red-200 text-red-800' :
            'bg-yellow-200 text-yellow-800'
          }`}>
            {getStatusIcon(request.status)}
            <span>{request.status}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-3">
        <div className="flex items-start">
          <div className="min-w-[100px] text-gray-500 text-sm">Cause:</div>
          <div className="font-medium text-gray-800">{request.cause}</div>
        </div>
        
        <div className="flex items-center">
          <div className="min-w-[100px] text-gray-500 text-sm">Leave Type:</div>
          <div className="font-medium text-gray-800">{request.leaveType}</div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t">
          <div>
            <div className="text-xs text-gray-500">Start Date</div>
            <div className="flex items-center mt-1">
              <Calendar className="w-4 h-4 mr-1 text-blue-500" />
              <span className="font-medium">
                {format(new Date(request.startDate), 'dd MMM yyyy')}
              </span>
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500">End Date</div>
            <div className="flex items-center mt-1">
              <Calendar className="w-4 h-4 mr-1 text-blue-500" />
              <span className="font-medium">
                {format(new Date(request.endDate), 'dd MMM yyyy')}
              </span>
            </div>
          </div>
        </div>
        
        <div className="pt-3 border-t flex justify-between items-center">
          <div>
            <div className="text-xs text-gray-500">Duration</div>
            <div className="font-medium text-gray-800">{request.duration} day{request.duration !== 1 ? 's' : ''}</div>
          </div>
          
          <div>
            <div className="text-xs text-gray-500">Submitted</div>
            <div className="text-sm text-gray-600">
              {format(new Date(request.submittedAt), 'dd MMM yyyy')}
            </div>
          </div>
        </div>

        {request.status === 'Pending' && (
          <div className="pt-4 border-t flex space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 py-2 rounded-lg font-medium transition-colors duration-200"
              onClick={() => onApprove(request.employeeId, request.id)}
            >
              Approve
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded-lg font-medium transition-colors duration-200"
              onClick={() => onReject(request.employeeId, request.id)}
            >
              Reject
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const LoadingCard = () => (
  <motion.div
    className="bg-white rounded-lg p-6 space-y-4 shadow-sm"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <div className="animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-2/3 mb-4" />
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
      <div className="border-t pt-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
  </motion.div>
);

const LoadingState = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[1, 2, 3].map((i) => (
      <LoadingCard key={i} />
    ))}
  </div>
);

const ErrorState = ({ error, onDismiss }: { error: string, onDismiss: () => void }) => (
  <motion.div
    className="mx-auto max-w-2xl bg-red-50 border border-red-200 rounded-lg p-4"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
  >
    <div className="flex items-center">
      <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
      <h3 className="text-red-800 font-medium">Error</h3>
    </div>
    <p className="text-red-700 mt-2">{error}</p>
    <button
      className="text-red-700 underline mt-2 text-sm hover:text-red-800"
      onClick={onDismiss}
    >
      Dismiss
    </button>
  </motion.div>
);

const LeavePage: React.FC = () => {
  const { leaveRequests, loading, error, fetchLeaveRequests, updateLeaveStatus, clearError } = useLeaveStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
 

  useEffect(() => {
    fetchLeaveRequests();
    clearError();
  }, [fetchLeaveRequests, clearError]);

  const handleApprove = (employeeId: string, leaveId: string) => {
    updateLeaveStatus(employeeId, leaveId, 'Approved');
  };

  const handleReject = (employeeId: string, leaveId: string) => {
    updateLeaveStatus(employeeId, leaveId, 'Rejected');
  };

  

  // Filter leave requests based on search term and status filter
  const filteredRequests = leaveRequests.filter(request => 
    (request.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
     request.cause.toLowerCase().includes(searchTerm.toLowerCase()) ||
     request.leaveType.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterStatus === 'all' || request.status === filterStatus)
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-[#154699] text-white md:hidden"
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      
      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      
        {/* <Sidebar 
          activePage={activePage} 
          onPageChange={handlePageChange} 
        /> */}
    
      
      <div className="flex-grow overflow-auto">
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Leave Requests</h1>
            
            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search requests..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              
              <div className="relative w-full sm:w-44">
                <select
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState error={error} onDismiss={clearError} />
            ) : filteredRequests.length === 0 ? (
              <motion.div
                className="text-center py-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'No matching leave requests found' 
                    : 'No pending leave requests found'}
                </h3>
                <p className="text-gray-500">
                  {searchTerm || filterStatus !== 'all'
                    ? 'Try adjusting your search or filter settings.'
                    : 'All leave requests have been processed.'}
                </p>
              </motion.div>
            ) : (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {filteredRequests.map((request) => (
                  <LeaveCard 
                    key={request.id} 
                    request={request} 
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          <EmployeeLeaveAnalytics />
        </div>
      </div>
    </div>
  );
};

export default LeavePage;