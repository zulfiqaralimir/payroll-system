# Phase 09 — CFO Approval Workflow
> Only start after Phase 08 is complete and confirmed.

---

## GOAL
Build payroll approval workflow for CFO Muhammad Faizan.

---

## Workflow

```
HR runs payroll → status = 'draft'
        ↓
HR reviews → clicks "Submit for Approval"
        ↓
Status = 'submitted'
CFO gets notification on dashboard
        ↓
CFO reviews payroll summary
        ↓
CFO APPROVES → status = 'approved'
  → Payslips can be released
  → Bank transfers generated

CFO REJECTS → status = 'rejected'
  → HR notified with reason
  → HR corrects and resubmits
```

---

## Pages to build

### 1. CFO Dashboard (localhost:3000/approvals)
- Pending approvals list
- Each item: Month, Year, Total Employees, Total Amount, Submitted By, Date
- View Details button → opens payroll summary
- Approve button + Reject button (with reason text)

### 2. Approval History
- All past approvals with status
- Filter by month/year
- Export to PDF

---

## VERIFICATION CHECKLIST
- [ ] HR can submit payroll for approval
- [ ] CFO sees pending approval on dashboard
- [ ] CFO can approve with one click
- [ ] CFO can reject with reason
- [ ] Status updates correctly throughout
- [ ] localhost:3000/approvals loads for CFO role

---

## NEXT STEP
Report back. Permission will be given for: phases/10-reports.md
DO NOT proceed without permission.
