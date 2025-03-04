import  { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Calendar, TrendingUp } from 'lucide-react';

// Define interfaces for our data structures
interface MonthData {
  name: string;
  [key: string]: string | number; // For dynamic employee names
}

interface Employee {
  id: string;
  name: string;
}

const EmployeeLeaveAnalytics = () => {
  const [leaveData, setLeaveData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    const fetchEmployeeLeaves = async () => {
      try {
        setLoading(true);
        const employeesCollectionRef = collection(db, 'employees');
        const employeeSnapshots = await getDocs(employeesCollectionRef);

        // Create map of employee IDs to names
        const employeesList: Employee[] = [];
        const employeeLeaveMap = new Map<string, number[]>();
        const employeeIdToNameMap = new Map<string, string>();

        // First, get all employee names and IDs
        for (const empDoc of employeeSnapshots.docs) {
          const employeeId = empDoc.id;
          
          // Access the employee_details subcollection
          const detailsDocRef = doc(db, `employees/${employeeId}/employee_details/details`);
          const detailsDoc = await getDoc(detailsDocRef);
          
          let employeeName = `Unknown (${employeeId.substring(0, 6)})`;
          
          // Check if details document exists and has a name field
          if (detailsDoc.exists() && detailsDoc.data().name) {
            employeeName = detailsDoc.data().name;
          }
          
          employeesList.push({ id: employeeId, name: employeeName });
          employeeIdToNameMap.set(employeeId, employeeName);
          employeeLeaveMap.set(employeeName, Array(12).fill(0));
        }
        
        setEmployees(employeesList);
        console.log(employees)
        // Fetch leaves for each employee
        for (const employee of employeesList) {
          const employeeId = employee.id;
          const employeeName = employee.name;
          
          const leavesCollectionRef = collection(db, `employees/${employeeId}/leaves`);
          const leavesQuery = query(
            leavesCollectionRef,
            where('status', '==', 'Approved')
          );
          const leaveSnapshots = await getDocs(leavesQuery);

          // Process each leave
          leaveSnapshots.forEach((leaveDoc) => {
            const leaveData = leaveDoc.data();
            const startDate = leaveData.startDate?.toDate();
            
            if (startDate && startDate.getFullYear() === selectedYear) {
              const month = startDate.getMonth();
              const monthData = employeeLeaveMap.get(employeeName);
              if (monthData) {
                monthData[month] += leaveData.duration;
              }
            }
          });
        }

        // Transform data for chart
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const chartData: MonthData[] = months.map((month, index) => {
          const monthData: MonthData = {
            name: month,
          };
          
          employeeLeaveMap.forEach((values, employeeName) => {
            monthData[employeeName] = values[index];
          });
          
          return monthData;
        });

        setLeaveData(chartData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching leave data:', error);
        setLoading(false);
      }
    };

    fetchEmployeeLeaves();
  }, [selectedYear]);

  const getRandomColor = (index: number): string => {
    const colors = [
      '#4299E1', '#48BB78', '#ED8936', '#9F7AEA',
      '#F56565', '#38B2AC', '#ECC94B', '#667EEA'
    ];
    return colors[index % colors.length];
  };

  const getEmployeeNames = (): string[] => {
    if (leaveData.length === 0) return [];
    return Object.keys(leaveData[0]).filter(key => key !== 'name');
  };

  return (
    <Card className="w-full mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-bold text-gray-800">
            Leave Analytics Dashboard
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Approved leaves distribution by employee
          </p>
        </div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {[...Array(5)].map((_, i) => {
            const year = new Date().getFullYear() - i;
            return (
              <option key={year} value={year}>
                {year}
              </option>
            );
          })}
        </select>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leaveData}>
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number, name: string) => [
                    `${value} days`, 
                    name
                  ]}
                />
                <Legend />
                {getEmployeeNames().map((employeeName, index) => (
                  <Bar
                    key={employeeName}
                    dataKey={employeeName}
                    fill={getRandomColor(index)}
                    name={employeeName}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <h3 className="font-medium">Total Leave Days ({selectedYear})</h3>
              </div>
              {getEmployeeNames().map((employeeName) => {
                const totalDays = leaveData.reduce((sum, month) => sum + (month[employeeName] as number), 0);
                return (
                  <div key={employeeName} className="mt-2 flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {employeeName}
                    </span>
                    <span className="font-medium">{totalDays} days</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <h3 className="font-medium">Monthly Average</h3>
              </div>
              {getEmployeeNames().map((employeeName) => {
                const totalDays = leaveData.reduce((sum, month) => sum + (month[employeeName] as number), 0);
                const average = (totalDays / 12).toFixed(1);
                return (
                  <div key={employeeName} className="mt-2 flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {employeeName}
                    </span>
                    <span className="font-medium">{average} days/month</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeLeaveAnalytics;