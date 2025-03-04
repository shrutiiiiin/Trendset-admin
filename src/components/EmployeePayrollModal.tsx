import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import useEmployeeStore, {  PayrollDetails } from "../store/useEmployee";

interface FormData {
  workingDays: string;
  reportedDays: string;
  basic: string;
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
    basic: "0",
    da: "0",
    hra: "0",
    specialPay: "0",
    providentFund: "0",
    professional: "0",
    advance: "0",
    tds: "0",
    grossEarning: "0",
    esic: "0",
    totalDeductions: "0",
    netPay: "0",
    cpf: "0",
    esicContribution: "0",
    medicalContribution: "0",
  });

  useEffect(() => {
    if (currentPayroll) {
      setFormData({
        workingDays: currentPayroll.workingDays || "31",
        reportedDays: currentPayroll.reportedDays || "31",
        basic: currentPayroll.basic || "0",
        da: currentPayroll.da || "0",
        hra: currentPayroll.hra || "0",
        specialPay: currentPayroll.specialPay || "0",
        providentFund: currentPayroll.providentFund || "0",
        professional: currentPayroll.professional || "0",
        advance: currentPayroll.advance || "0",
        tds: currentPayroll.tds || "0",
        grossEarning: currentPayroll.grossEarning || "0",
        esic: (parseFloat(currentPayroll.grossEarning || "0") * 0.0075).toFixed(2),
        totalDeductions: currentPayroll.totalDeductions || "0",
        netPay: currentPayroll.netPay || "0",
        cpf: currentPayroll.cpf || "0",
        esicContribution: currentPayroll.esicContribution || "0",
        medicalContribution: currentPayroll.medicalContribution || "0",
      });
    } else if (employee) {
      const workingDays = 31;
      const reportedDays = 31;
      const prorateFactor = reportedDays / workingDays;
      const basic = Math.round((employee.baseSalary || 0) * prorateFactor);
      const da = Math.round(basic * 0.25);
      const hra = Math.round(basic * 0.20);
      const specialPay = Math.round((employee.specialSalary || 0) * prorateFactor);
      const grossEarning = basic + da + hra + specialPay;
      const providentFund = Math.round(grossEarning * 0.0327);
      const professional = 200;
      const advance = 0;
      const tds = 0;
      const esic = Math.round(grossEarning * 0.0075);
      const totalDeductions = providentFund + professional + advance + tds + esic;
      const netPay = grossEarning - totalDeductions;
      const cpf = Math.round(grossEarning * 0.12);
      const esicContribution = Math.round(grossEarning * 0.0325);
      const medicalContribution = Math.round(grossEarning * 0.02);

      setFormData({
        workingDays: workingDays.toString(),
        reportedDays: reportedDays.toString(),
        basic: basic.toString(),
        da: da.toString(),
        hra: hra.toString(),
        specialPay: specialPay.toString(),
        providentFund: providentFund.toString(),
        professional: professional.toString(),
        advance: advance.toString(),
        tds: tds.toString(),
        grossEarning: grossEarning.toString(),
        esic: esic.toString(),
        totalDeductions: totalDeductions.toString(),
        netPay: netPay.toString(),
        cpf: cpf.toString(),
        esicContribution: esicContribution.toString(),
        medicalContribution: medicalContribution.toString(),
      });
    }
  }, [currentPayroll, employee]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const recalculate = () => {
    const workingDays = parseFloat(formData.workingDays) || 31;
    const reportedDays = parseFloat(formData.reportedDays) || workingDays;
    const baseSalary = parseFloat(employee.baseSalary?.toString() || "0");
    const specialSalary = parseFloat(employee.specialSalary?.toString() || "0");
    const prorateFactor = reportedDays / workingDays;
    const basic = Math.round(baseSalary * prorateFactor);
    const da = Math.round(basic * 0.25);
    const hra = Math.round(basic * 0.20);
    const specialPay = Math.round(specialSalary * prorateFactor);
    const grossEarning = basic + da + hra + specialPay;
    const providentFund = Math.round(grossEarning * 0.0327);
    const professional = parseFloat(formData.professional) || 200;
    const advance = parseFloat(formData.advance) || 0;
    const tds = parseFloat(formData.tds) || 0;
    const esic = Math.round(grossEarning * 0.0075);
    const totalDeductions = providentFund + professional + advance + tds + esic;
    const netPay = grossEarning - totalDeductions;
    const cpf = Math.round(grossEarning * 0.12);
    const esicContribution = Math.round(grossEarning * 0.0325);
    const medicalContribution = Math.round(grossEarning * 0.02);

    setFormData({
      ...formData,
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
    });
  };

  const handleSave = async () => {
    const payrollData: Omit<PayrollDetails, "createdAt"> = {
      employeeId,
      month: currentMonth,
      workingDays: formData.workingDays,
      reportedDays: formData.reportedDays,
      basic: formData.basic,
      da: formData.da,
      hra: formData.hra,
      specialPay: formData.specialPay,
      grossEarning: formData.grossEarning,
      providentFund: formData.providentFund,
      professional: formData.professional,
      advance: formData.advance,
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
              <Input value={employee.esicNumber || ""} readOnly />
            </div>
            <div>
              <Label>Designation</Label>
              <Input value={employee.designation} readOnly />
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
              <Label>Basic</Label>
              <Input
                type="number"
                value={formData.basic}
                onChange={(e) => handleInputChange("basic", e.target.value)}
              />
            </div>
            <div>
              <Label>DA</Label>
              <Input
                type="number"
                value={formData.da}
                onChange={(e) => handleInputChange("da", e.target.value)}
              />
            </div>
            <div>
              <Label>HRA</Label>
              <Input
                type="number"
                value={formData.hra}
                onChange={(e) => handleInputChange("hra", e.target.value)}
              />
            </div>
            <div>
              <Label>Special Pay</Label>
              <Input
                type="number"
                value={formData.specialPay}
                onChange={(e) => handleInputChange("specialPay", e.target.value)}
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
                onChange={(e) => handleInputChange("grossEarning", e.target.value)}
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
                onChange={(e) => handleInputChange("totalDeductions", e.target.value)}
              />
            </div>
            <div>
              <Label>Net Pay</Label>
              <Input
                type="number"
                value={formData.netPay}
                onChange={(e) => handleInputChange("netPay", e.target.value)}
              />
            </div>
            <div>
              <Label>CPF</Label>
              <Input
                type="number"
                value={formData.cpf}
                onChange={(e) => handleInputChange("cpf", e.target.value)}
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