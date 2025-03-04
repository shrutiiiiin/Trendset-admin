import { useState } from 'react';

interface Employee {
  id: string;
  name: string;
  email: string;
  designation: string;
  epfUan: string;
  esic: string;
  basePay: string;
  specialPay: string;
}

const useEmployeeManagement = () => {
  // Sample data
  const [employees] = useState<Employee[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      designation: 'Developer',
      epfUan: '12345',
      esic: '67890',
      basePay: '50000',
      specialPay: '10000'
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      designation: 'Designer',
      epfUan: '12346',
      esic: '67891',
      basePay: '45000',
      specialPay: '8000'
    }
  ]);

  return { employees };
};

export default useEmployeeManagement;