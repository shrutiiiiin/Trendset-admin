import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import useEmployeeStore, { PayrollDetails } from "../store/useEmployee";

interface FormData {
  workingDays: string;
  reportedDays: string;
  basic: string;         // Basic salary entered by admin when creating employee
  payScale: string;      // Calculated based on reported days
  da: string;
  hra: string;
  specialPay: string;
  providentFund: string;
  professional: string;
  advance: string;
  tds: string;
  grossEarning: string;
  esic: string;
  totalDeductions: string;
  netPay: string;
  cpf: string;
  esicContribution: string;
  medicalContribution: string;
}

const EmployeePayrollModal = ({
  employeeId,
  isOpen,
  onClose,
  currentMonth,
}: {
  employeeId: string;
  isOpen: boolean;
  onClose: () => void;
  currentMonth: string;
}) => {
  const { employees, payrolls, fetchPayrollDetails, updatePayroll } = useEmployeeStore();
  const employee = employees.find((emp) => emp.id === employeeId);
  const [currentPayroll, setCurrentPayroll] = useState<PayrollDetails | null>(null);

  useEffect(() => {
    if (isOpen && employeeId) {
      fetchPayrollDetails(employeeId, currentMonth);
    }
  }, [isOpen, employeeId, fetchPayrollDetails, currentMonth]);

  useEffect(() => {
    const currentPayrollData = payrolls.find(
      (p) => p.employeeId === employeeId && p.month === currentMonth
    );
    setCurrentPayroll(currentPayrollData || null);
  }, [payrolls, employeeId, currentMonth]);

  if (!employee) return null;

  const [formData, setFormData] = useState<FormData>({
    workingDays: "31",
    reportedDays: "31",
    basic: employee.baseSalary?.toString() || "0",  // Store the admin-entered baseSalary
    payScale: "0",                                  // Calculated field
    da: "0",
    hra: "0",
    specialPay: employee.specialSalary?.toString() || "0",
    providentFund: "1800",  // Default value as per requirement
    professional: "200",    // Default value as per requirement
    advance: "0",
    tds: "0",
    grossEarning: "0",
    esic: "0",
    totalDeductions: "0",
    netPay: "0",
    cpf: "1800",           // Default value same as providentFund
    esicContribution: "0",
    medicalContribution: "0",
  });

  useEffect(() => {
    if (currentPayroll) {
      setFormData({
        workingDays: currentPayroll.workingDays || "31",
        reportedDays: currentPayroll.reportedDays || "31",
        basic: employee.baseSalary?.toString() || "0",  // Always use the base salary from employee
        payScale: currentPayroll.payScale || "0",       // Use stored payScale if available
        da: currentPayroll.da || "0",
        hra: currentPayroll.hra || "0",
        specialPay: employee.specialSalary?.toString() || "0", // Use specialSalary from employee
        providentFund: currentPayroll.providentFund || "1800",
        professional: currentPayroll.professional || "200",
        advance: currentPayroll.advance || "0",
        tds: currentPayroll.tds || "0",
        grossEarning: currentPayroll.grossEarning || "0",
        esic: currentPayroll.esic || "0",
        totalDeductions: currentPayroll.totalDeductions || "0",
        netPay: currentPayroll.netPay || "0",
        cpf: currentPayroll.cpf || "1800",
        esicContribution: currentPayroll.esicContribution || "0",
        medicalContribution: currentPayroll.medicalContribution || "0",
      });
    } else if (employee) {
      // Initialize with default calculations
      recalculatePayroll(employee);
    }
  }, [currentPayroll, employee]);

  const recalculatePayroll = (employee: any) => {
    const workingDays = parseFloat(formData.workingDays) || 31;
    const reportedDays = parseFloat(formData.reportedDays) || workingDays;
    const baseSalary = parseFloat(employee.baseSalary?.toString() || "0");
    const specialSalary = parseFloat(employee.specialSalary?.toString() || "0");
    
    // 1. Pay Scale calculation
    const payScale = Math.round((reportedDays / workingDays) * baseSalary);
    
    // 2. DA calculation (25% of payScale)
    const da = Math.round(payScale * 0.25);
    
    // 3. HRA calculation (20% of payScale)
    const hra = Math.round(payScale * 0.2);
    
    // 4. Special Pay (use the value entered by admin)
    const specialPay = specialSalary;
    
    // 5. Gross Earning = payScale + specialPay (NOT including DA and HRA)
    const grossEarning = payScale + specialPay;
    
    // 6. Provident Fund (default 1800 unless changed)
    const providentFund = Math.round((payScale + da) * 0.25);
    
    // 7. Professional Tax (default 200 unless changed)
    const professional = parseFloat(formData.professional) || 200;
    
    // 8. TDS (use the value entered by admin)
    const tds = parseFloat(formData.tds) || 0;
    
    // 9. ESIC calculation (0.75% of grossEarning)
    const esic = Math.round(grossEarning * 0.0075);
    
    // 10. Total Deductions
    const totalDeductions = providentFund + professional + tds + esic;
    
    // 11. Net Pay
    const netPay = grossEarning - totalDeductions;
    
    // 12. CPF (same as providentFund but rounded)
    const cpf = Math.round(providentFund);
    
    // 13. ESIC Contribution (3.25% of grossEarning)
    const esicContribution = Math.round(grossEarning * 0.0325);
    
    // 14. Medical Contribution (use the value entered by admin)
    const medicalContribution = parseFloat(formData.medicalContribution) || 0;

    setFormData({
      workingDays: workingDays.toString(),
      reportedDays: reportedDays.toString(),
      basic: baseSalary.toString(), // Original base salary
      payScale: payScale.toString(), // Calculated pay scale
      da: da.toString(),
      hra: hra.toString(),
      specialPay: specialPay.toString(),
      providentFund: providentFund.toString(),
      professional: professional.toString(),
      advance: formData.advance,
      tds: tds.toString(),
      grossEarning: grossEarning.toString(),
      esic: esic.toString(),
      totalDeductions: totalDeductions.toString(),
      netPay: netPay.toString(),
      cpf: cpf.toString(),
      esicContribution: esicContribution.toString(),
      medicalContribution: medicalContribution.toString(),
    });
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const recalculate = () => {
    recalculatePayroll(employee);
  };

  const handleSave = async () => {
    const payrollData: Omit<PayrollDetails, "createdAt"> = {
      employeeId,
      month: currentMonth,
      workingDays: formData.workingDays,
      reportedDays: formData.reportedDays,
      basic: formData.basic,
      payScale: formData.payScale,  
      da: formData.da,
      hra: formData.hra,
      specialPay: formData.specialPay,
      grossEarning: formData.grossEarning,
      providentFund: formData.providentFund,
      professional: formData.professional,
      advance: formData.advance,
      esic: formData.esic,
      tds: formData.tds,
      totalDeductions: formData.totalDeductions,
      netPay: formData.netPay,
      cpf: formData.cpf,
      esicContribution: formData.esicContribution,
      medicalContribution: formData.medicalContribution,
    };

    await updatePayroll(employeeId, payrollData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Payroll for {employee.name} - {currentMonth}</DialogTitle>
        </DialogHeader>
        <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Employee ID</Label>
              <Input value={employee.employeeId} readOnly />
            </div>
            <div>
              <Label>Name</Label>
              <Input value={employee.name} readOnly />
            </div>
            <div>
              <Label>EPF UAN</Label>
              <Input value={employee.epfuanNumber || ""} readOnly />
            </div>
            <div>
              <Label>ESIC</Label>
              <Input value={employee.esicNumber || ""}    />
            </div>
            <div>
              <Label>Designation</Label>
              <Input value={employee.designation} readOnly />
            </div>
            <div>
              <Label>Basic Salary</Label>
              <Input value={formData.basic} readOnly />
            </div>
            <div>
              <Label>Working Days</Label>
              <Input
                type="number"
                value={formData.workingDays}
                onChange={(e) => handleInputChange("workingDays", e.target.value)}
              />
            </div>
            <div>
              <Label>Reported Days</Label>
              <Input
                type="number"
                value={formData.reportedDays}
                onChange={(e) => handleInputChange("reportedDays", e.target.value)}
              />
            </div>
            <div>
              <Label>Pay Scale</Label>
              <Input
                type="number"
                value={formData.payScale}
                readOnly  // Read-only since it's calculated
              />
            </div>
            <div>
              <Label>DA</Label>
              <Input
                type="number"
                value={formData.da}
                readOnly  // Read-only since it's calculated
              />
            </div>
            <div>
              <Label>HRA</Label>
              <Input
                type="number"
                value={formData.hra}
                readOnly  // Read-only since it's calculated
              />
            </div>
            <div>
              <Label>Special Pay</Label>
              <Input
                type="number"
                value={formData.specialPay}
                readOnly  // Read-only since it comes from employee record
              />
            </div>
            <div>
              <Label>PF</Label>
              <Input
                type="number"
                value={formData.providentFund}
                onChange={(e) => handleInputChange("providentFund", e.target.value)}
              />
            </div>
            <div>
              <Label>Professional Tax</Label>
              <Input
                type="number"
                value={formData.professional}
                onChange={(e) => handleInputChange("professional", e.target.value)}
              />
            </div>
            <div>
              <Label>Advance</Label>
              <Input
                type="number"
                value={formData.advance}
                onChange={(e) => handleInputChange("advance", e.target.value)}
              />
            </div>
            <div>
              <Label>TDS</Label>
              <Input
                type="number"
                value={formData.tds}
                onChange={(e) => handleInputChange("tds", e.target.value)}
              />
            </div>
            <div>
              <Label>Gross Earning</Label>
              <Input
                type="number"
                value={formData.grossEarning}
                readOnly  // Read-only since it's calculated
              />
            </div>
            <div>
              <Label>ESIC 0.75% Gross</Label>
              <Input
                type="number"
                value={formData.esic}

                onChange={(e) => handleInputChange("esic", e.target.value)}
              />
            </div>
            <div>
              <Label>Total Deductions</Label>
              <Input
                type="number"
                value={formData.totalDeductions}
                readOnly  // Read-only since it's calculated
              />
            </div>
            <div>
              <Label>Net Pay</Label>
              <Input
                type="number"
                value={formData.netPay}
                readOnly  // Read-only since it's calculated
              />
            </div>
            <div>
              <Label>CPF</Label>
              <Input
                type="number"
                value={formData.cpf}
                readOnly  // Read-only since it's calculated
              />
            </div>
            <div>
              <Label>ESIC Contribution (3.25%)</Label>
              <Input
                type="number"
                value={formData.esicContribution}

                onChange={(e) => handleInputChange("esicContribution", e.target.value)}

              />
            </div>
            <div>
              <Label>Medical Contribution</Label>
              <Input
                type="number"
                value={formData.medicalContribution}
                onChange={(e) => handleInputChange("medicalContribution", e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-4 space-x-2">
          <Button onClick={recalculate} variant="outline">Recalculate</Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeePayrollModal;