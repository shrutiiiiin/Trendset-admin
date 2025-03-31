import React, { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import useEmployeeStore from "../store/useEmployee";
import { parse, format } from "date-fns";

interface EmployeeFormData {
  name: string;
  email: string;
  designation: string;
  customDesignation?: string;
  employeeId: string;
  dateOfJoining: string;
  epfUan: string;
  esic: string;
  basePay: number;
  specialPay: number;
}
interface NewEmployeeData {
  employeeId: string;
  createdAt: Timestamp;
  name: string;
  email: string;
  designation: string;
  baseSalary: number;
  specialSalary: number;
  epfuanNumber: string;
  esicNumber: string;
  dateOfJoining: string;
  password: string;
}

const PRESET_DESIGNATIONS = [
  "Country Manager",
  "Sales Manager",
  "Service Engineer",
  "Account Officer Jr",
];

const AddEmployee = () => {
  const addEmployee = useEmployeeStore((state) => state.addEmployee);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCustomDesignation, setShowCustomDesignation] = useState(false);

  const [formData, setFormData] = useState<EmployeeFormData>({
    name: "",
    email: "",
    designation: "",
    customDesignation: "",
    employeeId: "",
    dateOfJoining: "",
    epfUan: "",
    esic: "",
    basePay: 0,
    specialPay: 0,
  });

  useEffect(() => {
    const verifyDB = async () => {
      try {
        const testDoc = doc(db, "test", "test");
        await setDoc(testDoc, { test: true }, { merge: true });
        console.log("Firebase connection successful");
      } catch (error) {
        console.error("Firebase connection failed:", error);
        setError("Database connection failed. Please try again later.");
      }
    };
    verifyDB();
  }, []);

  const validateForm = () => {
    if (!formData.name.trim()) throw new Error("Employee name is required");
    if (!formData.email.trim()) throw new Error("Email address is required");
    if (!formData.employeeId.trim()) throw new Error("Employee ID is required");
    if (!formData.dateOfJoining.trim())
      throw new Error("Date of joining is required");
    if (showCustomDesignation && !formData.customDesignation?.trim()) {
      throw new Error(
        'Custom designation is required when "Other" is selected'
      );
    }
    if (!showCustomDesignation && !formData.designation) {
      throw new Error("Please select a designation");
    }
  };
  const sendWelcomeEmail = async (employeeData: NewEmployeeData) => {
    try {
      const emailData = {
        to: employeeData.email,
        subject: `Welcome to Our Company, ${employeeData.name}!`,
        body: `Dear ${employeeData.name},

Welcome to our team! We're excited to have you join us as a ${employeeData.designation}.

Your login credentials:
Employee ID: ${employeeData.employeeId}
Employee Password: ${employeeData.password}

Please use these credentials to log into our employee portal.


`,
      };

      const response = await fetch(
        "https://stormthor619.pythonanywhere.com/send_email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(emailData),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send welcome email");
      }

      console.log("Welcome email sent successfully");
      return true;
    } catch (error) {
      console.error("Error sending welcome email:", error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      validateForm();

      let isoDate: string;
      try {
        const parsedDate = parse(
          formData.dateOfJoining,
          "dd/MM/yyyy",
          new Date()
        );
        if (isNaN(parsedDate.getTime())) {
          throw new Error("Invalid date format");
        }
        isoDate = format(parsedDate, "yyyy-MM-dd");
      } catch (err) {
        throw new Error("Please enter date in DD/MM/YYYY format");
      }

      const employeeDocRef = doc(db, "employees", formData.employeeId);
      const detailsDocRef = doc(employeeDocRef, "employee_details", "details");

      // Ensure designation is always a string
      const finalDesignation = showCustomDesignation
        ? formData.customDesignation || ""
        : formData.designation;

      // Validate designation before proceeding
      if (!finalDesignation) {
        throw new Error("Designation is required");
      }

      const employeeData: NewEmployeeData = {
        employeeId: formData.employeeId,
        createdAt: Timestamp.now(), // Use Firebase Timestamp instead of ISO string
        name: formData.name,
        email: formData.email,
        designation: finalDesignation,
        baseSalary: formData.basePay,
        specialSalary: formData.specialPay,
        epfuanNumber: formData.epfUan,
        esicNumber: formData.esic,
        dateOfJoining: isoDate,
        password: Math.random().toString(36).slice(-8),
      };

      await setDoc(employeeDocRef, {
        employeeId: formData.employeeId,
        createdAt: Timestamp.now(), // Use Firebase Timestamp here as well
      });

      await setDoc(detailsDocRef, employeeData);
      await addEmployee(employeeData);

      const emailSent = await sendWelcomeEmail(employeeData);

      setFormData({
        name: "",
        email: "",
        designation: "",
        customDesignation: "",
        employeeId: "",
        dateOfJoining: "",
        epfUan: "",
        esic: "",
        basePay: 0,
        specialPay: 0,
      });
      if (emailSent) {
        alert("Employee added successfully and welcome email sent!");
      } else {
        alert(
          "Employee added successfully but failed to send welcome email. Please notify the employee manually."
        );
      }

      alert("Employee added successfully!");
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      setError(err instanceof Error ? err.message : "Failed to add employee");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "basePay" || name === "specialPay") {
      const numberValue = parseInt(value.replace(/\D/g, "")) || 0;
      setFormData((prev) => ({
        ...prev,
        [name]: numberValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSelectChange = (value: string) => {
    const isOther = value === "other";
    setShowCustomDesignation(isOther);
    setFormData((prev) => ({
      ...prev,
      designation: isOther ? "" : value,
      customDesignation: isOther ? prev.customDesignation : "",
    }));
  };

  const handleCustomDesignationChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      customDesignation: value,
      designation: value,
    }));
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString("en-IN");
  };

  const renderBasicDetailsCard = () => (
    <Card className="p-6">
      <div className="space-y-6">
        <h2 className="text-xl font-semibold mb-4 text-slate-900">
          Basic Details
        </h2>
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
              value={showCustomDesignation ? "other" : formData.designation}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select designation" />
              </SelectTrigger>
              <SelectContent>
                {PRESET_DESIGNATIONS.map((designation) => (
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
        <h2 className="text-xl font-semibold mb-4 text-slate-900">
          Work Details
        </h2>
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
        <h2 className="text-xl font-semibold mb-4 text-slate-900">
          Salary Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="basePay">Base Pay (₹)</Label>
            <Input
              id="basePay"
              name="basePay"
              type="text"
              value={formData.basePay ? formatNumber(formData.basePay) : ""}
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
              value={
                formData.specialPay ? formatNumber(formData.specialPay) : ""
              }
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
      {/* <Sidebar 
        activePage={activePage} 
        onPageChange={setActivePage} 
      /> */}
      <div className="flex-grow overflow-auto p-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-slate-900">
            Add Employee
          </h1>

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
              <Button variant="outline" type="button" disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Adding Employee..." : "Add Employee"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEmployee;
