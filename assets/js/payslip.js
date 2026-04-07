// Payslip generation using jsPDF
function formatCurrencyINR(amount) {
	return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function computePayrollBreakup(baseSalary) {
	// Simple illustrative breakup
	const hra = Math.round(baseSalary * 0.40);
	const basic = Math.round(baseSalary * 0.50);
	const allowances = Math.round(baseSalary * 0.10);
	const pf = Math.round(basic * 0.12);
	const professionalTax = 200;
	const gross = basic + hra + allowances;
	const deductions = pf + professionalTax;
	const net = gross - deductions;
	return { basic, hra, allowances, pf, professionalTax, gross, net };
}

function generatePayslipPdf(employee, month) {
	/* global jspdf */
	const { jsPDF } = window.jspdf;
	const doc = new jsPDF();
	const line = (x1, y1, x2, y2) => doc.line(x1, y1, x2, y2);
	let y = 16;

	// Header
	doc.setFontSize(16);
	doc.text('Yodhin Solutions', 14, y);
	doc.setFontSize(10);
	doc.text('Attendance & Payroll', 14, y + 6);
	doc.setFontSize(12);
	doc.text(`Payslip - ${month}`, 150, y, { align: 'right' });
	line(14, y + 8, 196, y + 8);
	y += 16;

	// Employee details
	doc.setFontSize(11);
	doc.text(`Employee: ${employee.name} (${employee.id})`, 14, y);
	doc.text(`Role: ${employee.role}`, 14, y + 6);
	doc.text(`Team: ${employee.team}`, 14, y + 12);
	doc.text(`Email: ${employee.email}`, 14, y + 18);
	doc.text(`Phone: ${employee.phone}`, 14, y + 24);

	const breakup = computePayrollBreakup(employee.salary);
	y += 34;
	line(14, y, 196, y);
	y += 8;

	// Earnings
	doc.setFontSize(12);
	doc.text('Earnings', 14, y);
	doc.text('Amount', 90, y);
	doc.text('Deductions', 120, y);
	doc.text('Amount', 180, y);
	y += 6;
	doc.setFontSize(11);
	doc.text('Basic', 14, y); doc.text(formatCurrencyINR(breakup.basic), 90, y, { align: 'right' });
	doc.text('Provident Fund (12%)', 120, y); doc.text(formatCurrencyINR(breakup.pf), 196, y, { align: 'right' });
	y += 6;
	doc.text('HRA', 14, y); doc.text(formatCurrencyINR(breakup.hra), 90, y, { align: 'right' });
	doc.text('Professional Tax', 120, y); doc.text(formatCurrencyINR(breakup.professionalTax), 196, y, { align: 'right' });
	y += 6;
	doc.text('Allowances', 14, y); doc.text(formatCurrencyINR(breakup.allowances), 90, y, { align: 'right' });
	y += 8;
	line(14, y, 196, y);
	y += 8;
	doc.text('Gross', 14, y); doc.text(formatCurrencyINR(breakup.gross), 90, y, { align: 'right' });
	doc.text('Total Deductions', 120, y); doc.text(formatCurrencyINR(breakup.pf + breakup.professionalTax), 196, y, { align: 'right' });
	y += 8;
	line(14, y, 196, y);
	y += 10;
	doc.setFontSize(13);
	doc.text(`Net Pay: ${formatCurrencyINR(breakup.net)}`, 14, y);
	y += 10;
	doc.setFontSize(10);
	doc.text('This is a system generated payslip and does not require signature.', 14, y);

	doc.save(`${employee.id}_${employee.name.replace(/\s+/g, '_')}_${month}_payslip.pdf`);
	return breakup;
}


