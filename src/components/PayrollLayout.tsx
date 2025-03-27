import { useState, useEffect } from 'react';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import useEmployeeStore, { EmployeeDetails, PayrollCalculationInput, PayrollDetails,  } from '../store/useEmployee';
import * as XLSX from 'xlsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import EmployeePayrollModal from './EmployeePayrollModal';
import { format, subMonths, addMonths } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { collection, query, where, getDocs, doc, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';


export interface PayrollData extends EmployeeDetails {
  workingDays: string;
  reportedDays: string;
  basic: string;
  payScale: string; // Added payScale field
  da: string;
  hra: string;
  specialPay: string;
  grossEarning: string;
  providentFund: string;
  professional: string;
  advance: string;
  tds: string;
  esic: string; // Added esic field
  totalDeductions: string;
  netPay: string;
  cpf: string;
  esicContribution: string;
  medicalContribution: string;
}

export const calculatePayroll = (row: PayrollCalculationInput) => {
  const workingDays = parseFloat(row.workingDays) || 31;
  const reportedDays = parseFloat(row.reportedDays) || 0;
  const baseSalary = parseFloat(row.basic) || 0;
  const specialSalary = parseFloat(row.specialPay) || 0;
  
  // Calculate payScale based on reported days
  const payScale = reportedDays === 0 
  ? baseSalary  // If no reported days, use the base salary
  : Math.round((reportedDays / workingDays) * baseSalary);
  
  // DA calculation (25% of payScale)
  const da =  parseFloat(row.da)|| Math.round(payScale * 0.25);
  
  // HRA calculation (20% of payScale)
  const hra =  parseFloat(row.hra)|| Math.round(payScale * 0.2);
  
  // Gross Earning = payScale + specialPay
  const grossEarning = payScale + specialSalary + da + hra;
  
  // Provident Fund - default to 1800 if not set
  const providentFund = parseFloat(row.providentFund) || 1800;
  
  // Professional Tax - default to 200
  const professional = parseFloat(row.professional) ;
  
  // Advance and TDS from row
  const advance = parseFloat(row.advance) || 0;
  const tds = parseFloat(row.tds) || 0;
  
  // ESIC calculation (0.75% of grossEarning)
  const esic = parseFloat(row.esic)|| Math.round(grossEarning * 0.0075);
  
  // Total Deductions
  const totalDeductions = providentFund + professional + advance + tds + esic;
  
  // Net Pay
  const netPay = grossEarning - totalDeductions;
  
  // CPF (same as providentFund)
  const cpf = providentFund;
  
  // ESIC Contribution (3.25% of grossEarning)
  const esicContribution =parseFloat(row.esicContribution)|| Math.round(grossEarning * 0.0325);
  
  // Medical Contribution - from row or default to 0
  const medicalContribution = parseFloat(row.medicalContribution) || 0;
  
  return {
    payScale: payScale.toString(),
    basic: baseSalary.toString(),
    da: da.toString(),
    hra: hra.toString(),
    specialPay: specialSalary.toString(),
    grossEarning: grossEarning.toString(),
    providentFund: providentFund.toString(),
    professional: professional.toString(),
    advance: advance.toString(),
    tds: tds.toString(),
    esic: esic.toString(),
    totalDeductions: totalDeductions.toString(),
    netPay: netPay.toString(),
    cpf: cpf.toString(),
    esicContribution: esicContribution.toString(),
    medicalContribution: medicalContribution.toString(),
  };
};

const getDaysInMonth = (month: string) => {
  const [monthNum, year] = month.split('-');
  return new Date(parseInt(year), parseInt(monthNum), 0).getDate();
};

const formatMonthForDisplay = (month: string) => {
  const [monthNum, year] = month.split('-');
  const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
  return format(date, 'MMMM yyyy');
};

const getAvailableMonths = () => {
  const months = [];
  const today = new Date();
  
  for (let i = 0; i < 3; i++) {
    const date = subMonths(today, i);
    months.push(format(date, 'MM-yyyy'));
  }
  
  return months;
};

const PayrollTable = () => {
  const { employees, payrolls, fetchEmployees, fetchPayrollsForMonth, updatePayroll, deleteOldPayrolls } = useEmployeeStore();
  const [editableData, setEditableData] = useState<PayrollData[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'MM-yyyy'));
  const [isLoading, setIsLoading] = useState(false);
  const availableMonths = getAvailableMonths();

  useEffect(() => {
    fetchEmployees();
    
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - now.getTime();
    
    const timeoutId = setTimeout(() => {
      deleteOldPayrolls(3); 
      const intervalId = setInterval(() => {
        deleteOldPayrolls(3);
      }, 24 * 60 * 60 * 1000);
      
      return () => clearInterval(intervalId);
    }, msUntilMidnight);
    
    return () => clearTimeout(timeoutId);
  }, [fetchEmployees, deleteOldPayrolls]);

  useEffect(() => {
    if (employees.length > 0) {
      fetchPayrollsForMonth(currentMonth);
    }
  }, [currentMonth, fetchPayrollsForMonth, employees]);

  useEffect(() => {
    const transformedData: PayrollData[] = employees.map((emp) => {
      const payrollForMonth = payrolls.find(
        (p) => p.employeeId === emp.id && p.month === currentMonth
      );
      
      if (payrollForMonth) {
        return {
          ...emp,
          workingDays: payrollForMonth.workingDays,
          reportedDays: payrollForMonth.reportedDays,
          basic: emp.baseSalary?.toString() || '0',  // Always use employee's base salary
          payScale: payrollForMonth.payScale || '0',  // Include payScale from payroll
          da: payrollForMonth.da,
          hra: payrollForMonth.hra,
          specialPay: emp.specialSalary?.toString() || '0', // Always use employee's special salary
          grossEarning: payrollForMonth.grossEarning,
          providentFund: payrollForMonth.providentFund,
          professional: payrollForMonth.professional,
          advance: payrollForMonth.advance,
          tds: payrollForMonth.tds,
          esic: payrollForMonth.esic || '0',  // Include esic from payroll
          totalDeductions: payrollForMonth.totalDeductions,
          netPay: payrollForMonth.netPay,
          cpf: payrollForMonth.cpf,
          esicContribution: payrollForMonth.esicContribution,
          medicalContribution: payrollForMonth.medicalContribution,
        };
      } else {
        // Use default values and calculate payroll
        const daysInMonth = getDaysInMonth(currentMonth);
        const defaultData = {
          ...emp,
          workingDays: daysInMonth.toString(),
          reportedDays: '0',
          basic: emp.baseSalary?.toString() || '0',
          payScale: emp.baseSalary?.toString() || '0', // Initialize payScale
          da: '0',
          hra: '0',
          specialPay: emp.specialSalary?.toString() || '0',
          grossEarning: '0',
          providentFund: '1800',  // Default value
          professional: '200',
          advance: '0',
          tds: '0',
          esic: '0',
          totalDeductions: '0',
          netPay: '0',
          cpf: '1800',
          esicContribution: '0',
          medicalContribution: '0',
        };
        
        const calculations = calculatePayroll(defaultData);
        return {
          ...defaultData,
          ...calculations,
        };
      }
    });
    
    setEditableData(transformedData);
  }, [employees, payrolls, currentMonth]);

  const loading = useEmployeeStore(state => state.loading);

 

  // Calculate attendance from daily data
  // const calculateAttendanceForEmployee = async (employeeId: string, month: string) => {
  //   try {
  //     const attendanceDays = await fetchDailyAttendanceData(employeeId, month);
  //     return attendanceDays;
  //   } catch (error) {
  //     console.error('Error fetching attendance data:', error);
  //     return null;
  //   }
  // };

  
  // const fetchDailyAttendanceData = async (employeeId: string, month: string) => {
  //   const [monthNum, year] = month.split('-');
  //   const daysInMonth = getDaysInMonth(month);
    
  //   let presentDays = 0;
    
  //   // Create a date range for the month - starting with first day
  //   const startDate = `01-${monthNum}-${year}`;
  //   // Format the last day with leading zero if necessary
  //   const lastDay = daysInMonth.toString().padStart(2, '0');
  //   const endDate = `${lastDay}-${monthNum}-${year}`;
    
  //   // Query Firestore for daily attendance records
  //   const dailyDataRef = collection(db, 'employees', employeeId, 'daily_data');
    
  //   try {
  //     // Use compound query to get all records for the month date range
  //     const q = query(
  //       dailyDataRef,
  //       where('date', '>=', startDate),
  //       where('date', '<=', endDate)
  //     );
      
  //     const querySnapshot = await getDocs(q);
      
  //     querySnapshot.forEach((doc) => {
  //       const data = doc.data();
  //       if (data.status === 'present') {
  //         presentDays++;
  //       }
  //     });
      
  //     console.log(`Employee ${employeeId} has ${presentDays} present days in ${month}`);
  //     return presentDays;
  //   } catch (error) {
  //     console.error(`Error fetching attendance for employee ${employeeId}:`, error);
  //     throw error;
  //   }
  // };

  const deleteCurrentMonthData = async () => {
    if (!confirm(`Are you sure you want to delete ALL data for ${formatMonthForDisplay(currentMonth)}? This will remove both payroll and attendance records for this month.`)) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await deleteAttendanceData();
      
      const payrollsToDelete = payrolls.filter(p => p.month === currentMonth);
      
      if (payrollsToDelete.length > 0) {
        
        const BATCH_SIZE = 450;
        let batch = writeBatch(db);
        let operationCount = 0;
        
        for (const payroll of payrollsToDelete) {
      
          const payrollRef = doc(db, 'employees', payroll.employeeId, 'payroll', payroll.month);
          
          batch.delete(payrollRef);
          operationCount++;
          
          if (operationCount >= BATCH_SIZE) {
            await batch.commit();
            batch = writeBatch(db);
            operationCount = 0;
          }
        }
        
        // Commit any remaining operations
        if (operationCount > 0) {
          await batch.commit();
        }
      }
      
      // Refresh data after deletion
      fetchPayrollsForMonth(currentMonth);
      
      alert(`Successfully deleted all data for ${formatMonthForDisplay(currentMonth)}`);
      
      // If the deleted month was the current one, navigate to the newest available month
      if (availableMonths.length > 0 && !availableMonths.includes(currentMonth)) {
        setCurrentMonth(availableMonths[0]);
      }
      
    } catch (error) {
      console.error('Error deleting month data:', error);
      alert('Failed to delete month data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAttendanceData = async () => {
    try {
      const [monthNum, year] = currentMonth.split('-');
      const daysInMonth = getDaysInMonth(currentMonth);
      const startDate = `01-${monthNum}-${year}`;
      const lastDay = daysInMonth.toString().padStart(2, '0');
      const endDate = `${lastDay}-${monthNum}-${year}`;
      
      let totalDeleted = 0;
      
      for (const employee of employees) {
        const dailyDataRef = collection(db, 'employees', employee.id, 'daily_data');
        const q = query(
          dailyDataRef,
          where('date', '>=', startDate),
          where('date', '<=', endDate)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          // Use batched writes for more efficient deletes
          // Firestore limits batches to 500 operations
          const BATCH_SIZE = 450;
          let batch = writeBatch(db);
          let operationCount = 0;
          
          for (const document of querySnapshot.docs) {
            batch.delete(doc(db, 'employees', employee.id, 'daily_data', document.id));
            operationCount++;
            totalDeleted++;
            
            // If we've reached the batch limit, commit and start a new batch
            if (operationCount >= BATCH_SIZE) {
              await batch.commit();
              batch = writeBatch(db);
              operationCount = 0;
            }
          }
          
          // Commit any remaining operations
          if (operationCount > 0) {
            await batch.commit();
          }
        }
      }
      
      console.log(`Deleted ${totalDeleted} attendance records for ${formatMonthForDisplay(currentMonth)}`);
      return totalDeleted;
      
    } catch (error) {
      console.error('Error deleting attendance data:', error);
      throw error;
    }
  };

  // const updateAttendanceForAll = async () => {
  //   setIsLoading(true);
  //   const updatedData = [...editableData];
    
  //   try {
  //     for (let i = 0; i < employees.length; i++) {
  //       const emp = employees[i];
        
  //       // Parse the month and year from currentMonth (format: "MM-yyyy")
  //       const [monthStr, yearStr] = currentMonth.split('-');
        
  //       // Get all documents in the daily_data collection for this employee
  //       const dailyDataRef = collection(db, 'employees', emp.id, 'daily_data');
  //       const querySnapshot = await getDocs(dailyDataRef);
        
  //       // Count documents that match the current month
  //       let attendanceDays = 0;
        
  //       querySnapshot.forEach((doc) => {
  //         // Document ID is in format "DD-MM-YYYY"
  //         const docId = doc.id;
  //         const dateParts = docId.split('-');
          
  //         // Check if it's a valid date format
  //         if (dateParts.length === 3) {
  //           const docMonth = dateParts[1]; // Month part (MM)
  //           const docYear = dateParts[2];  // Year part (YYYY)
            
  //           // If the document is for the current month/year
  //           if (docMonth === monthStr && docYear === yearStr) {
  //             attendanceDays++;
  //           }
  //         }
  //       });
        
  //       console.log(`Employee ${emp.id} has ${attendanceDays} present days in ${monthStr}-${yearStr}`);
        
  //       updatedData[i] = {
  //         ...updatedData[i],
  //         reportedDays: attendanceDays.toString(),
  //       };
        
  //       // Recalculate payroll based on new attendance
  //       const calculations = calculatePayroll(updatedData[i]);
  //       updatedData[i] = {
  //         ...updatedData[i],
  //         ...calculations,
  //       };
  //     }
      
  //     setEditableData(updatedData);
      
  //     // Save the updated data
  //     const savePromises = updatedData.map(async (employee) => {
  //       const calculations = calculatePayroll(employee);
  //       const payrollData: Omit<PayrollDetails, 'createdAt'> = {
  //         employeeId: employee.id,
  //         month: currentMonth,
  //         workingDays: employee.workingDays,
  //         reportedDays: employee.reportedDays,
  //         basic: employee.basic,
  //         payScale: calculations.payScale, // Include payScale
  //         da: calculations.da,
  //         hra: calculations.hra,
  //         specialPay: calculations.specialPay,
  //         grossEarning: calculations.grossEarning,
  //         providentFund: calculations.providentFund,
  //         professional: calculations.professional,
  //         advance: employee.advance,
  //         esic: calculations.esic, // Include esic
  //         tds: employee.tds,
  //         totalDeductions: calculations.totalDeductions,
  //         netPay: calculations.netPay,
  //         cpf: calculations.cpf,
  //         esicContribution: calculations.esicContribution,
  //         medicalContribution: calculations.medicalContribution,
  //       };
  //       return updatePayroll(employee.id, payrollData);
  //     });
      
  //     await Promise.all(savePromises);
  //     alert('Attendance data updated and saved successfully!');
  //   } catch (error) {
  //     console.error('Error updating attendance data:', error);
  //     alert('Failed to update some attendance data. Please try again.');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const exportToExcel = () => {
    // Define headers for the Excel sheet
    const headers = [
      "Employee ID",
      "Name",
      "Designation",
      "Working Days",
      "Reported Days",
      "Basic Pay",
      "Pay Scale",
      "DA",
      "HRA",
      "Special Pay",
      "Gross Earning",
      "Provident Fund",
      "Professional Tax",
      "Advance",
      "TDS",
      "ESIC 0.75",
      "Total Deductions",
      "Net Pay",
      "CPF",
      "ESIC Contribution",
      "Medical Contribution",
    ];
  
    // Transform editableData into an array of arrays with formulas
    const data = editableData.map((row, index) => {
      const rowNum = index + 2; // Row number starts at 2 (after headers)
      return [
        row.employeeId, // A
        row.name,       // B
        row.designation,// C
        row.workingDays,// D
        row.reportedDays,// E
        row.basic,      // F
        // Pay Scale: =IF(E{row}=0,F{row},ROUND((E{row}/D{row})*F{row},0))
        { f: `=IF(E${rowNum}=0,F${rowNum},ROUND((E${rowNum}/D${rowNum})*F${rowNum},0))` }, // G
        // DA: =ROUND(G{row}*0.25,0)
        { f: `=ROUND(G${rowNum}*0.25,0)` }, // H
        // HRA: =ROUND(G{row}*0.2,0)
        { f: `=ROUND(G${rowNum}*0.2,0)` }, // I
        row.specialPay, // J
        // Gross Earning: =G{row}+J{row}+H{row}+I{row}
        { f: `=G${rowNum}+J${rowNum}+H${rowNum}+I${rowNum}` }, // K
        row.providentFund || "1800", // L
        row.professional || "200",   // M
        row.advance || "0",          // N
        row.tds || "0",              // O
        // ESIC: =ROUND(K{row}*0.0075,0)
        { f: `=ROUND(K${rowNum}*0.0075,0)` }, // P
        // Total Deductions: =SUM(L{row}:P{row})
        { f: `=SUM(L${rowNum}:P${rowNum})` }, // Q
        // Net Pay: =K{row}-Q{row}
        { f: `=K${rowNum}-Q${rowNum}` }, // R
        row.cpf || "1800", // S (CPF same as PF by default)
        // ESIC Contribution: =ROUND(K{row}*0.0325,0)
        { f: `=ROUND(K${rowNum}*0.0325,0)` }, // T
        row.medicalContribution || "0", // U
      ];
    });
  
    // Create worksheet from array of arrays
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  
    // Optional: Set column widths for better readability
    ws['!cols'] = [
      { wch: 15 }, // A: Employee ID
      { wch: 20 }, // B: Name
      { wch: 20 }, // C: Designation
      { wch: 12 }, // D: Working Days
      { wch: 12 }, // E: Reported Days
      { wch: 12 }, // F: Basic
      { wch: 12 }, // G: Pay Scale
      { wch: 12 }, // H: DA
      { wch: 12 }, // I: HRA
      { wch: 12 }, // J: Special Pay
      { wch: 15 }, // K: Gross Earning
      { wch: 15 }, // L: Provident Fund
      { wch: 15 }, // M: Professional Tax
      { wch: 12 }, // N: Advance
      { wch: 12 }, // O: TDS
      { wch: 12 }, // P: ESIC
      { wch: 15 }, // Q: Total Deductions
      { wch: 15 }, // R: Net Pay
      { wch: 12 }, // S: CPF
      { wch: 15 }, // T: ESIC Contribution
      { wch: 15 }, // U: Medical Contribution
    ];
  
    // Create workbook and append sheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payroll");
  
    // Export the file
    XLSX.writeFile(wb, `Payroll_${currentMonth}.xlsx`);
  };

  const saveAllPayrolls = async () => {
    setIsLoading(true);
    
    const savePromises = editableData.map(async (employee) => {
      const calculations = calculatePayroll(employee);
      const payrollData: Omit<PayrollDetails, 'createdAt'> = {
        employeeId: employee.id,
        month: currentMonth,
        workingDays: employee.workingDays,
        reportedDays: employee.reportedDays,
        basic: employee.basic,
        payScale: calculations.payScale, // Include payScale
        da: calculations.da,
        hra: calculations.hra,
        specialPay: calculations.specialPay,
        grossEarning: calculations.grossEarning,
        providentFund: calculations.providentFund,
        professional: calculations.professional,
        advance: employee.advance,
        esic: calculations.esic, // Include esic
        tds: employee.tds,
        totalDeductions: calculations.totalDeductions,
        netPay: calculations.netPay,
        cpf: calculations.cpf,
        esicContribution: calculations.esicContribution,
        medicalContribution: calculations.medicalContribution,
      };
      return updatePayroll(employee.id, payrollData);
    });

    try {
      await Promise.all(savePromises);
      alert('All payroll data saved successfully!');
    } catch (error) {
      console.error('Error saving payroll data:', error);
      alert('Failed to save some payroll data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle month change
  const changeMonth = (newMonth: string) => {
    setCurrentMonth(newMonth);
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    const [month, year] = currentMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const prevMonth = format(subMonths(date, 1), 'MM-yyyy');
    
    // Don't allow navigating earlier than 3 months ago
    const threeMonthsAgo = format(subMonths(new Date(), 2), 'MM-yyyy');
    
    if (prevMonth >= threeMonthsAgo) {
      setCurrentMonth(prevMonth);
    }
  };

  // Navigate to next month
  const goToNextMonth = () => {
    const [month, year] = currentMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const nextMonth = format(addMonths(date, 1), 'MM-yyyy');
    
    // Don't allow navigating to future months
    const currentDate = new Date();
    const currentMonthFormatted = format(currentDate, 'MM-yyyy');
    
    if (nextMonth <= currentMonthFormatted) {
      setCurrentMonth(nextMonth);
    }
  };

  // Check if we're at the current month
  const isCurrentMonth = format(new Date(), 'MM-yyyy') === currentMonth;
  
  // Check if we're at the oldest available month (3 months ago)
  const oldestMonth = format(subMonths(new Date(), 2), 'MM-yyyy');
  const isOldestMonth = oldestMonth === currentMonth || currentMonth < oldestMonth;

  return (
    <div className="w-full h-screen max-h-screen bg-white flex flex-col overflow-hidden">
      <div className="w-full px-6 py-4 border-b bg-white">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Payroll Management</h1>
          <div className="flex space-x-4 items-center">
            <div className="flex items-center space-x-2">
              <Button 
                onClick={goToPreviousMonth} 
                variant="outline" 
                size="icon" 
                disabled={isOldestMonth || isLoading }
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Select value={currentMonth} onValueChange={changeMonth} disabled={isLoading }>
                <SelectTrigger className="w-[180px]">
                  <SelectValue>{formatMonthForDisplay(currentMonth)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableMonths.map((month) => (
                    <SelectItem key={month} value={month}>
                      {formatMonthForDisplay(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                onClick={goToNextMonth} 
                variant="outline" 
                size="icon" 
                disabled={isCurrentMonth || isLoading }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            {/* <Button 
              onClick={updateAttendanceForAll} 
              variant="outline" 
              disabled={isLoading }
            >
              {isLoading ? 'Updating...' : 'Update Attendance'}
            </Button>
             */}
            <Button 
              onClick={saveAllPayrolls} 
              variant="default" 
              disabled={isLoading }
            >
              {isLoading ? 'Saving...' : 'Save All Payrolls'}
            </Button>
            
            <Button 
              onClick={exportToExcel} 
              variant="outline" 
              disabled={isLoading }
            >
              <Download className="mr-2 h-4 w-4" />
              Export to Excel
            </Button>
            
            <Button 
              onClick={deleteCurrentMonthData} 
              variant="destructive" 
              disabled={isLoading }
            >
              Delete Month Data
            </Button>
          </div>
        </div>
      </div>
  
      <div className="flex-1 p-6 overflow-hidden">
        <div className="border rounded-lg h-full overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                <p className="text-gray-500">Loading payroll data...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-auto">
              <Table className="w-full">
                <TableHeader className="sticky top-0 bg-gray-100 z-10">
                  <TableRow>
                    <TableHead className="w-32 p-4 text-left">Employee ID</TableHead>
                    <TableHead className="w-48 p-4 text-left">Name</TableHead>
                    <TableHead className="w-40 p-4 text-left">Designation</TableHead>
                    <TableHead className="w-36 p-4 text-left">Working Days</TableHead>
                    <TableHead className="w-36 p-4 text-left">Reported Days</TableHead>
                    <TableHead className="w-36 p-4 text-left">Basic</TableHead>
                    <TableHead className="w-36 p-4 text-left">Pay Scale</TableHead>
                    <TableHead className="w-36 p-4 text-left">Special Pay</TableHead>
                    <TableHead className="w-36 p-4 text-left">Gross Earning</TableHead>
                    <TableHead className="w-36 p-4 text-left">Total Deductions</TableHead>
                    <TableHead className="w-36 p-4 text-left">Net Pay</TableHead>
                    <TableHead className="w-24 p-4 text-left">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editableData.map((row) => (
                    <TableRow key={row.id} className="hover:bg-gray-50">
                      <TableCell className="p-4 text-left">{row.employeeId}</TableCell>
                      <TableCell className="p-4 text-left">{row.name}</TableCell>
                      <TableCell className="p-4 text-left">{row.designation}</TableCell>
                      <TableCell className="p-4 text-left">{row.workingDays}</TableCell>
                      <TableCell className="p-4 text-left">{row.reportedDays}</TableCell>
                      <TableCell className="p-4 text-left">{row.basic}</TableCell>
                      <TableCell className="p-4 text-left">{row.payScale}</TableCell>
                      <TableCell className="p-4 text-left">{row.specialPay}</TableCell>
                      <TableCell className="p-4 text-left">{row.grossEarning}</TableCell>
                      <TableCell className="p-4 text-left">{row.totalDeductions}</TableCell>
                      <TableCell className="p-4 text-left font-medium">{row.netPay}</TableCell>
                      <TableCell className="p-4 text-left">
                        <Button
                          onClick={() => {
                            setSelectedEmployeeId(row.id);
                            setIsModalOpen(true);
                          }}
                          size="sm"
                          disabled={isLoading }
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
  
      {selectedEmployeeId && (
        <EmployeePayrollModal
          employeeId={selectedEmployeeId}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          currentMonth={currentMonth}
        />
      )}
    </div>
  );
};

export default PayrollTable;