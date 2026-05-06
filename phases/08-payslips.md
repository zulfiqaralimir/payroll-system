# Phase 08 — PDF Payslip Generation
> Only start after Phase 07 is complete and confirmed.

---

## GOAL
Generate PDF payslips matching exactly the WellServe salary slip format.

---

## Payslip Format (match WellServe template exactly)

```
Wellserve Oilfield Services (Pvt) Ltd.
Plot 5-J & 5-K, Street 1, I-10/3, Islamabad

SALARY SLIP

Employee Name: [Name]     Employee ID: [ITS-001]   Period: [Apr-24]
Job Title: [Designation]                           Bank Account: [number]

LEFT COLUMN — SALARY          RIGHT COLUMN — DEDUCTIONS
Basic Pay           92,500    Absent Days              0
House Rent Allow.   37,000    Leave without Pay        0
Utility Allowance    4,625    EOBI                   320
Conveyance Allow.    4,625    Income Tax           3,000
Over Time # Hrs          0    Provident Fund       2,464
Rig Bonus # Days         0    Other Deductions         0
Travelling Allow.        0    Loan Deductions     12,500
Arrears                  0    PF Loan Deduction        0
Annual Bonus        46,250
Reimbursement/Adj.  74,233    TOTAL               18,104
                              Bank Account: 02-28-20311...
TOTAL              259,233    NET SALARY           51,297

NOTE: This is computer generated document.
      It does not require any signatures.
```

---

## Install package
```bash
npm install puppeteer
```

---

## Features
- Generate PDF for single employee
- Generate all PDFs as ZIP download
- Email payslip to employee
- Archive payslips by month/year

---

## Pages to build

### 1. Payslips Page (localhost:3000/payslips)
- Select Month + Year
- "Generate All Payslips" button
- Table: Employee, Generated, Emailed, Download
- Download individual PDF
- Download all as ZIP
- Send email button per employee

---

## VERIFICATION CHECKLIST
- [ ] PDF generated matches WellServe format exactly
- [ ] All salary components show correctly
- [ ] PKR format with commas e.g. 51,297
- [ ] Download single PDF works
- [ ] Download all as ZIP works
- [ ] localhost:3000/payslips loads correctly

---

## NEXT STEP
Report back. Permission will be given for: phases/09-approvals.md
DO NOT proceed without permission.
