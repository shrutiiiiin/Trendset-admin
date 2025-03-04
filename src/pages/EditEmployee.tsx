import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useParams, useNavigate } from 'react-router-dom';
import { parse, format } from 'date-fns';
import useEmployeeStore from '../store/useEmployee';


const PRESET_DESIGNATIONS = [
  "Country Manager",
  "Sales Manager",
  "Service Engineer",
  "Account Officer Jr"
];

const EditEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { employees, updateEmployee } = useEmployeeStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCustomDesignation, setShowCustomDesignation] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    designation: '',
    customDesignation: '',
    employeeId: '',
    dateOfJoining: '',
    epfUan: '',
    esic: '',
    basePay: 0,
    specialPay: 0
  });

  // Find the employee data by ID
  useEffect(() => {
    if (!id) {
      setError('Employee ID is missing');
      return;
    }

    const employee = employees.find(emp => emp.id === id);
    
    if (!employee) {
      setError('Employee not found');
      return;
    }

    // Check if the designation is one of the preset options
    const isPresetDesignation = PRESET_DESIGNATIONS.includes(employee.designation);
    setShowCustomDesignation(!isPresetDesignation);

    // Format the date from ISO to DD/MM/YYYY
    let formattedDate = '';
    try {
      if (employee.dateOfJoining) {
        const date = new Date(employee.dateOfJoining);
        formattedDate = format(date, 'dd/MM/yyyy');
      }
    } catch (err) {
      console.error('Date parsing error:', err);
    }

    // Set form data from employee
    setFormData({
      name: employee.name || '',
      email: employee.email || '',
      designation: isPresetDesignation ? employee.designation : '',
      customDesignation: !isPresetDesignation ? employee.designation : '',
      employeeId: employee.employeeId || '',
      dateOfJoining: formattedDate,
      epfUan: employee.epfuanNumber || '',
      esic: employee.esicNumber || '',
      basePay: employee.baseSalary || 0,
      specialPay: employee.specialSalary || 0
    });
  }, [id, employees]);

  const validateForm = () => {
    if (!formData.name.trim()) throw new Error('Employee name is required');
    if (!formData.email.trim()) throw new Error('Email address is required');
    if (!formData.employeeId.trim()) throw new Error('Employee ID is required');
    if (!formData.dateOfJoining.trim()) throw new Error('Date of joining is required');
    if (showCustomDesignation && !formData.customDesignation?.trim()) {
      throw new Error('Custom designation is required when "Other" is selected');
    }
    if (!showCustomDesignation && !formData.designation) {
      throw new Error('Please select a designation');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!id) {
      setError('Employee ID is missing');
      setLoading(false);
      return;
    }

    try {
      validateForm();

      let isoDate: string;
      try {
        const parsedDate = parse(formData.dateOfJoining, 'dd/MM/yyyy', new Date());
        if (isNaN(parsedDate.getTime())) {
          throw new Error('Invalid date format');
        }
        isoDate = format(parsedDate, 'yyyy-MM-dd');
      } catch (err) {
        throw new Error('Please enter date in DD/MM/YYYY format');
      }

      // Ensure designation is always a string
      const finalDesignation = showCustomDesignation 
        ? formData.customDesignation || '' 
        : formData.designation;

      // Validate designation before proceeding
      if (!finalDesignation) {
        throw new Error('Designation is required');
      }
      
      const updatedEmployeeData = {
        name: formData.name,
        email: formData.email,
        designation: finalDesignation,
        employeeId: formData.employeeId,
        dateOfJoining: isoDate,
        epfuanNumber: formData.epfUan,
        esicNumber: formData.esic,
        baseSalary: formData.basePay,
        specialSalary: formData.specialPay
      };

      await updateEmployee(id, updatedEmployeeData);
      alert('Employee updated successfully!');
      navigate(`/employee/${id}`); // Navigate to employee details page after successful update
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err instanceof Error ? err.message : 'Failed to update employee');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'basePay' || name === 'specialPay') {
      const numberValue = parseInt(value.replace(/\D/g, '')) || 0;
      setFormData(prev => ({
        ...prev,
        [name]: numberValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSelectChange = (value: string) => {
    const isOther = value === 'other';
    setShowCustomDesignation(isOther);
    setFormData(prev => ({
      ...prev,
      designation: isOther ? '' : value,
      customDesignation: isOther ? prev.customDesignation : ''
    }));
  };

  const handleCustomDesignationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      customDesignation: value,
      designation: value
    }));
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-IN');
  };

  const renderBasicDetailsCard = () => (
    <Card className="p-6">
      <div className="space-y-6">
        <h2 className="text-xl font-semibold mb-4 text-slate-900">Basic Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Employee Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="John Doe"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="john.doe@company.com"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="employeeId">Employee ID</Label>
            <Input
              id="employeeId"
              name="employeeId"
              type="text" 
              value={formData.employeeId}
              onChange={handleInputChange}
              placeholder="EMP001"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dateOfJoining">Date of Joining</Label>
            <div className="relative">
              <Input
                id="dateOfJoining"
                name="dateOfJoining"
                type="text"
                value={formData.dateOfJoining}
                onChange={handleInputChange}
                placeholder="DD/MM/YYYY"
                pattern="\d{2}/\d{2}/\d{4}"
                required
              />
              <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="designation">Designation</Label>
            <Select 
              onValueChange={handleSelectChange} 
              value={showCustomDesignation ? 'other' : formData.designation} 
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select designation" />
              </SelectTrigger>
              <SelectContent>
                {PRESET_DESIGNATIONS.map(designation => (
                  <SelectItem key={designation} value={designation}>
                    {designation}
                  </SelectItem>
                ))}
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            
            {showCustomDesignation && (
              <div className="mt-2">
                <Input
                  type="text"
                  placeholder="Enter custom designation"
                  value={formData.customDesignation}
                  onChange={handleCustomDesignationChange}
                  className="w-full"
                  required
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  const renderWorkDetailsCard = () => (
    <Card className="p-6">
      <div className="space-y-6">
        <h2 className="text-xl font-semibold mb-4 text-slate-900">Work Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="epfUan">EPF UAN</Label>
            <Input
              id="epfUan"
              name="epfUan"
              value={formData.epfUan}
              onChange={handleInputChange}
              placeholder="Enter EPF UAN"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="esic">ESIC</Label>
            <Input
              id="esic"
              name="esic"
              value={formData.esic}
              onChange={handleInputChange}
              placeholder="Enter ESIC"
              required
            />
          </div>
        </div>
      </div>
    </Card>
  );

  const renderSalaryDetailsCard = () => (
    <Card className="p-6">
      <div className="space-y-6">
        <h2 className="text-xl font-semibold mb-4 text-slate-900">Salary Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="basePay">Base Pay (₹)</Label>
            <Input
              id="basePay"
              name="basePay"
              type="text"
              value={formData.basePay ? formatNumber(formData.basePay) : ''}
              onChange={handleInputChange}
              placeholder="Enter base pay"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="specialPay">Special Pay (₹)</Label>
            <Input
              id="specialPay"
              name="specialPay"
              type="text"
              value={formData.specialPay ? formatNumber(formData.specialPay) : ''}
              onChange={handleInputChange}
              placeholder="Enter special pay"
              required
            />
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="flex h-screen">
      <div className="flex-grow overflow-auto p-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-slate-900">Edit Employee</h1>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {renderBasicDetailsCard()}
            {renderWorkDetailsCard()}
            {renderSalaryDetailsCard()}

            <div className="flex justify-end space-x-4">
              <Button 
                variant="outline" 
                type="button" 
                disabled={loading}
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving Changes...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditEmployee;