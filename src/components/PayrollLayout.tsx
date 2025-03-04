// In PayrollTable.tsx

import  { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import useEmployeeStore, { EmployeeDetails, PayrollDetails } from '../store/useEmployee';
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
import { format } from 'date-fns';

// PayrollData interface (unchanged)
export interface PayrollData extends EmployeeDetails {
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
}

// calculatePayroll function (unchanged)
export const calculatePayroll = (row: PayrollData) => {
  // Default values
  const workingDays = parseFloat(row.workingDays) || 31;
  const reportedDays = parseFloat(row.reportedDays) || workingDays;
  const baseSalary = parseFloat(row.basic) || 0;
  const specialSalary = parseFloat(row.specialPay) || 0;
  const advance = parseFloat(row.advance) || 0;
  const tds = parseFloat(row.tds) || 0;
  
  const prorateFactor = reportedDays / workingDays;
  const proratedBasic = Math.round(baseSalary * prorateFactor);
  
  const basic = proratedBasic;
  const da = Math.round(basic * 0.25);
  const hra = Math.round(basic * 0.20);
  const specialPay = Math.round(specialSalary * prorateFactor);
  const grossEarning = basic + da + hra + specialPay;
  
  const providentFund = Math.round(grossEarning * 0.0327);
  const professional = 200;
  const esic = Math.round(grossEarning * 0.0075);
  const totalDeductions = providentFund + professional + advance + tds + esic;
  const netPay = grossEarning - totalDeductions;
  
  const cpf = Math.round(grossEarning * 0.0327);
  const esicContribution = Math.round(grossEarning * 0.0325);
  const medicalContribution = Math.round(grossEarning * 0.02);
  
  return {
    basic: basic.toString(),
    da: da.toString(),
    hra: hra.toString(),
    specialPay: specialPay.toString(),
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

const PayrollTable = () => {
  const { employees, payrolls, fetchEmployees, fetchPayrollsForMonth, updatePayroll } = useEmployeeStore();
  const [editableData, setEditableData] = useState<PayrollData[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMonth] = useState(format(new Date(), 'MM-yyyy'));

  // Fetch employees on mount
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Fetch payrolls when currentMonth changes
  useEffect(() => {
    fetchPayrollsForMonth(currentMonth);
  }, [currentMonth, fetchPayrollsForMonth]);

  // Update editableData based on employees and payrolls
  useEffect(() => {
    const transformedData: PayrollData[] = employees.map((emp) => {
      const payrollForMonth = payrolls.find(
        (p) => p.employeeId === emp.id && p.month === currentMonth
      );
      if (payrollForMonth) {
        // Use saved payroll data
        return {
          ...emp,
          workingDays: payrollForMonth.workingDays,
          reportedDays: payrollForMonth.reportedDays,
          basic: payrollForMonth.basic,
          da: payrollForMonth.da,
          hra: payrollForMonth.hra,
          specialPay: payrollForMonth.specialPay,
          grossEarning: payrollForMonth.grossEarning,
          providentFund: payrollForMonth.providentFund,
          professional: payrollForMonth.professional,
          advance: payrollForMonth.advance,
          tds: payrollForMonth.tds,
          totalDeductions: payrollForMonth.totalDeductions,
          netPay: payrollForMonth.netPay,
          cpf: payrollForMonth.cpf,
          esicContribution: payrollForMonth.esicContribution,
          medicalContribution: payrollForMonth.medicalContribution,
        };
      } else {
        // Use default values and calculate payroll
        const defaultData = {
          ...emp,
          workingDays: '31',
          reportedDays: '31',
          basic: emp.baseSalary?.toString() || '0',
          da: '0',
          hra: '0',
          specialPay: emp.specialSalary?.toString() || '0',
          grossEarning: '0',
          providentFund: '0',
          professional: '0',
          advance: '0',
          tds: '0',
          totalDeductions: '0',
          netPay: '0',
          cpf: '0',
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

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(editableData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payroll");
    XLSX.writeFile(wb, `Payroll_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const saveAllPayrolls = async () => {
    const savePromises = editableData.map(async (employee) => {
      const calculations = calculatePayroll(employee);
      const payrollData: Omit<PayrollDetails, 'createdAt'> = {
        employeeId: employee.id,
        month: currentMonth,
        workingDays: employee.workingDays,
        reportedDays: employee.reportedDays,
        basic: calculations.basic,
        da: calculations.da,
        hra: calculations.hra,
        specialPay: calculations.specialPay,
        grossEarning: calculations.grossEarning,
        providentFund: calculations.providentFund,
        professional: calculations.professional,
        advance: employee.advance,
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
    }
  };





  return (
    <div className="w-full h-screen max-h-screen bg-white flex flex-col overflow-hidden">
      <div className="w-full px-6 py-4 border-b bg-white">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Payroll Management</h1>
          <div className="flex space-x-4 items-center">
            
            <Button onClick={saveAllPayrolls} variant="default">
              Save All Payrolls
            </Button>
            <Button onClick={exportToExcel} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export to Excel
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-hidden">
        <div className="border rounded-lg h-full overflow-hidden flex flex-col">
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
                  {/* <TableHead className="w-36 p-4 text-left">DA</TableHead>
                  <TableHead className="w-36 p-4 text-left">HRA</TableHead> */}
                  <TableHead className="w-36 p-4 text-left">Special Pay</TableHead>
                  <TableHead className="w-36 p-4 text-left">Gross Earning</TableHead>
                  {/* <TableHead className="w-36 p-4 text-left">PF</TableHead>
                  <TableHead className="w-36 p-4 text-left">Prof. Tax</TableHead> */}
                  {/* <TableHead className="w-36 p-4 text-left">ESIC</TableHead> */}
                  {/* <TableHead className="w-36 p-4 text-left">Advance</TableHead>
                  <TableHead className="w-36 p-4 text-left">TDS</TableHead> */}
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
                    {/* <TableCell className="p-4 text-left">{row.da}</TableCell>
                    <TableCell className="p-4 text-left">{row.hra}</TableCell> */}
                    <TableCell className="p-4 text-left">{row.specialPay}</TableCell>
                    <TableCell className="p-4 text-left">{row.grossEarning}</TableCell>
                    {/* <TableCell className="p-4 text-left">{row.providentFund}</TableCell>
                    <TableCell className="p-4 text-left">{row.professional}</TableCell>
                    <TableCell className="p-4 text-left">{row.esicNumber}</TableCell>
                    <TableCell className="p-4 text-left">{row.advance}</TableCell>
                    <TableCell className="p-4 text-left">{row.tds}</TableCell> */}
                    <TableCell className="p-4 text-left">{row.totalDeductions}</TableCell>
                    <TableCell className="p-4 text-left font-medium">{row.netPay}</TableCell>
                    <TableCell className="p-4 text-left">
                      <Button
                        onClick={() => {
                          setSelectedEmployeeId(row.id);
                          setIsModalOpen(true);
                        }}
                        size="sm"
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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