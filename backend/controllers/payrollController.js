// Payroll calculation engine — exact logic per phases/03-backend.md

async function calculateGross(employee, salaryStructure,
                               overtimeRate, rigBonusRate,
                               travellingRate, attendance) {
  const basic       = parseFloat(salaryStructure.basic_pay) || 0;
  const hra         = basic * ((parseFloat(salaryStructure.hra_percentage) || 40) / 100);
  const utility     = basic * ((parseFloat(salaryStructure.utility_percentage) || 5)  / 100);
  const conveyance  = basic * ((parseFloat(salaryStructure.conveyance_percentage) || 5) / 100);

  const otNormal    = (parseFloat(attendance.overtime_normal_hours)  || 0) * (parseFloat(overtimeRate?.normal_rate)  || 0);
  const otHoliday   = (parseFloat(attendance.overtime_holiday_hours) || 0) * (parseFloat(overtimeRate?.holiday_rate) || 0);
  const overtimeAmt = otNormal + otHoliday;

  const rigBonus1   = (parseFloat(attendance.rig_bonus_days_1) || 0) * (parseFloat(rigBonusRate?.rate_usd_1) || 0)
                      * (parseFloat(rigBonusRate?.usd_conv_rate) || 278);
  const rigBonus2   = (parseFloat(attendance.rig_bonus_days_2) || 0) * (parseFloat(rigBonusRate?.rate_usd_2) || 0)
                      * (parseFloat(rigBonusRate?.usd_conv_rate) || 278);
  const rigBonusAmt = rigBonus1 + rigBonus2;

  const travelAmt   = (parseFloat(attendance.travelling_days)      || 0)
                      * (parseFloat(travellingRate?.daily_rate)     || 0)
                      * (parseFloat(travellingRate?.conv_rate)      || 1);

  const gross = basic + hra + utility + conveyance
              + overtimeAmt + rigBonusAmt + travelAmt
              + (parseFloat(attendance.annual_bonus)   || 0)
              + (parseFloat(attendance.arrears)        || 0)
              + (parseFloat(attendance.reimbursement)  || 0)
              + (parseFloat(attendance.advance_salary) || 0)
              + (parseFloat(attendance.meal_allowance) || 0);

  return {
    basic_pay:            basic,
    house_rent_allowance: hra,
    utility_allowance:    utility,
    conveyance_allowance: conveyance,
    overtime_amount:      overtimeAmt,
    rig_bonus_amount:     rigBonusAmt,
    travelling_amount:    travelAmt,
    annual_bonus:         parseFloat(attendance.annual_bonus)   || 0,
    arrears:              parseFloat(attendance.arrears)        || 0,
    reimbursement:        parseFloat(attendance.reimbursement)  || 0,
    advance_salary:       parseFloat(attendance.advance_salary) || 0,
    meal_allowance:       parseFloat(attendance.meal_allowance) || 0,
    gross_salary:         gross
  };
}

async function calculateTax(annualGross, taxSlabs) {
  const slab = taxSlabs.find(s =>
    annualGross >= parseFloat(s.min_income) &&
    (s.max_income === null || annualGross <= parseFloat(s.max_income))
  );
  if (!slab) return 0;
  const annualTax = parseFloat(slab.fixed_tax) +
    ((annualGross - parseFloat(slab.min_income)) * parseFloat(slab.tax_rate) / 100);
  return annualTax / 12;
}

async function calculateDeductions(employee, salaryStructure,
                                    attendance, gross, taxSlabs) {
  const perDayRate  = parseFloat(salaryStructure.per_day_rate) || 0;
  const absentDed   = (parseFloat(attendance.absent_days)       || 0) * perDayRate;
  const lwpDed      = (parseFloat(attendance.leave_without_pay) || 0) * perDayRate;
  const eobi        = employee.eobi_applicable ? 320 : 0;
  const annualGross = gross * 12;
  const tax         = await calculateTax(annualGross, taxSlabs);
  const taxAdj      = parseFloat(attendance.tax_adjustment) || 0;
  const pf          = employee.pf_member
                      ? (parseFloat(salaryStructure.basic_pay) || 0) * 0.0833 : 0;

  const totalDed = eobi + tax + taxAdj + pf
                 + (parseFloat(attendance.loan_deduction)   || 0)
                 + (parseFloat(attendance.pf_loan)          || 0)
                 + absentDed + lwpDed
                 + (parseFloat(attendance.other_deductions) || 0);

  return {
    eobi,
    income_tax:       tax + taxAdj,
    provident_fund:   pf,
    absent_deduction: absentDed,
    lwp_deduction:    lwpDed,
    loan_deduction:   parseFloat(attendance.loan_deduction)   || 0,
    pf_loan:          parseFloat(attendance.pf_loan)          || 0,
    other_deductions: parseFloat(attendance.other_deductions) || 0,
    total_deductions: totalDed
  };
}

module.exports = { calculateGross, calculateDeductions, calculateTax };
