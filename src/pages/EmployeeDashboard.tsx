import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useEmployeeStore from '../store/useEmployee';
import { 
  Building2, Mail, MapPin, Clock, 
  Search, Plus, Tag, UserCircle, AlertCircle, XCircle,
  Edit, Trash2, MoreVertical
} from 'lucide-react';
import { format } from 'date-fns';
import { EmployeeDetails } from '../store/useEmployee';

const EmployeeCard = ({ employee }: { employee: EmployeeDetails }) => {
  const navigate = useNavigate();
  const { deleteEmployee } = useEmployeeStore();
  const [showActions, setShowActions] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  const handleCardClick = () => {
    navigate(`/employee/${employee.id}`);
  };
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/edit-employee/${employee.id}`);
  };
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDelete(true);
  };
  
  const handleDeleteConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteEmployee(employee.id);
    setConfirmDelete(false);
  };
  
  const handleDeleteCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDelete(false);
  };
  
  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActions(!showActions);
  };

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 
                 border border-gray-100 overflow-hidden group cursor-pointer relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ 
        scale: 1.02, 
        boxShadow: '0 10px 15px rgba(0,0,0,0.1)' 
      }}
      transition={{ duration: 0.2 }}
      onClick={handleCardClick}
    >
      {/* Action button */}
      <button 
        className="absolute top-2 right-2 p-2 text-white/70 hover:text-white transition-colors z-10"
        onClick={handleMoreClick}
      >
        <MoreVertical className="w-5 h-5" />
      </button>
      
      {/* Action menu */}
      <AnimatePresence>
        {showActions && (
          <motion.div 
            className="absolute top-10 right-2 bg-white shadow-lg rounded-md z-20"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="p-1">
              <button 
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-md w-full"
                onClick={handleEdit}
              >
                <Edit className="w-4 h-4 text-blue-500" />
                <span>Edit</span>
              </button>
              <button 
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-red-50 rounded-md w-full"
                onClick={handleDeleteClick}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
                <span>Delete</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Delete confirmation */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div 
            className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-4 z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2 text-center">Delete Employee?</h3>
            <p className="text-sm text-gray-500 mb-4 text-center">
              This will permanently remove {employee.name} from the system.
            </p>
            <div className="flex space-x-3">
              <button 
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                onClick={handleDeleteCancel}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                onClick={handleDeleteConfirm}
              >
                Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
        <div className="flex items-center space-x-3">
          <UserCircle className="w-10 h-10 text-white/80" />
          <div>
            <h3 className="font-semibold text-lg">{employee.name}</h3>
            <div className="flex items-center text-sm text-white/70 space-x-2">
              <Tag className="w-4 h-4" />
              <span>{employee.employeeId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-3">
        <div className="flex items-center text-gray-600">
          <Building2 className="w-5 h-5 mr-3 text-blue-500" />
          <span className="font-medium">{employee.designation}</span>
        </div>
        
        <div className="flex items-center text-gray-600">
          <Mail className="w-5 h-5 mr-3 text-blue-500" />
          <span>{employee.email}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t">
  <div className="flex items-center text-gray-600">
    <span className="w-5 h-5 mr-2 text-green-500">₹</span>
    <div>
      <span className="text-xs text-gray-500">Base</span>
      <div className="font-semibold">₹{employee.baseSalary?.toLocaleString()}</div>
    </div>
  </div>

  <div className="flex items-center text-gray-600">
    <span className="w-5 h-5 mr-2 text-green-500">₹</span>
    <div>
      <span className="text-xs text-gray-500">Special</span>
      <div className="font-semibold">₹{employee.specialSalary?.toLocaleString()}</div>
    </div>
  </div>
</div>

        
        <div className="pt-3 border-t space-y-2">
          {employee.todayLocation ? (
            <>
              <div className="flex items-center text-gray-600">
                <MapPin className="w-5 h-5 mr-3 text-green-500" />
                <span className="text-sm truncate max-w-[200px]">
                  {employee.todayLocation.address}
                </span>
              </div>
              <div className="flex items-center text-gray-600">
                <Clock className="w-5 h-5 mr-3 text-purple-500" />
                <span className="text-sm">
                  {format(new Date(employee.todayLocation.timestamp), 'dd MMM yyyy HH:mm')}
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center text-gray-600">
              <XCircle className="w-5 h-5 mr-3 text-red-500" />
              <span className="text-sm font-medium text-red-500">Not Checked In Today</span>
            </div>
          )}
        </div>
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

const ErrorState = ({ error }: { error: string }) => (
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
      onClick={() => window.location.reload()}
    >
      Try reloading the page
    </button>
  </motion.div>
);

const EmployeeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { employees, loading, error, fetchEmployees } = useEmployeeStore();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Filter employees based on search term
  const filteredEmployees = employees.filter(employee => 
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search employees..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
          onClick={() => navigate('/add-employee')}
        >
          <Plus className="w-4 h-4" />
          <span>Add Employee</span>
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} />
        ) : filteredEmployees.length === 0 ? (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No matching employees found' : 'No Employees Found'}
            </h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search terms.' : 'Start by adding your first employee to the system.'}
            </p>
            {!searchTerm && (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2 mx-auto"
                onClick={() => navigate('/add-employee')}
              >
                <Plus className="w-4 h-4" />
                <span>Add Employee</span>
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {filteredEmployees.map((employee) => (
              <EmployeeCard key={employee.id} employee={employee} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmployeeDashboard;