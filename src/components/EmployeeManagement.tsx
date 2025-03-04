// components/EmployeeManagement.tsx
import React, { useState } from 'react';

interface Employee {
  id: number;
  name: string;
  email: string;
  position: string;
}

export const useEmployeeManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");

  const addEmployee = () => {
    if (!name || !email || !position) return;

    const newEmployee: Employee = {
      id: employees.length + 1,
      name,
      email,
      position,
    };

    setEmployees([...employees, newEmployee]);
    setName("");
    setEmail("");
    setPosition("");
  };

  return {
    employees,
    name,
    email,
    position,
    setName,
    setEmail,
    setPosition,
    addEmployee
  };
};

const EmployeeManagement: React.FC = () => {
  const {
    employees,
    name,
    email,
    position,
    setName,
    setEmail,
    setPosition,
    addEmployee
  } = useEmployeeManagement();

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Add New Employee</h2>
        <div className="max-w-lg space-y-4">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded-lg"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded-lg"
          />
          <input
            type="text"
            placeholder="Position"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="w-full p-2 border rounded-lg"
          />
          <button
            onClick={addEmployee}
            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg w-full"
          >
            Add Employee
          </button>
        </div>

        <h3 className="text-lg font-semibold mt-8 mb-4">Employee List</h3>
        <div className="border rounded-lg">
          {employees.length > 0 ? (
            <ul>
              {employees.map((emp) => (
                <li key={emp.id} className="p-4 border-b last:border-b-0">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{emp.name}</p>
                      <p className="text-sm text-gray-600">{emp.position}</p>
                      <p className="text-sm text-gray-500">{emp.email}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-4 text-gray-500">No employees added yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeManagement;