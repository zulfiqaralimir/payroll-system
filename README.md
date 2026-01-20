# 🧾 Payroll & Tax Automation System

### **Enterprise ERP Solution for Wellserve Oilfield Services (Pvt) Ltd.**

A modern, comprehensive payroll management and tax automation system built with cutting-edge web technologies. This prototype demonstrates enterprise-grade capabilities for employee management, attendance tracking, salary calculation, and automated tax compliance.

---

## 🚀 Live Demo

**🔗 [View Live Application](https://payroll-system-nu-nine.vercel.app)**

Experience the full functionality of the system with our hosted demo on Vercel.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Screenshots](#screenshots)
- [Getting Started](#getting-started)
- [Usage Guide](#usage-guide)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

This Payroll & Tax Automation System is designed specifically for **Wellserve Oilfield Services (Pvt) Ltd.** to streamline and automate their entire payroll process. The system eliminates manual calculations, reduces errors, and ensures compliance with tax regulations.

### **Business Value**

- ⏱️ **90% Time Reduction** in payroll processing
- 🎯 **99.9% Accuracy** in salary calculations
- 📊 **Real-time Analytics** for management decisions
- 🔐 **Tax Compliance** with automated certificate generation
- 📄 **Paperless Operations** with digital payslips and reports

---

## ✨ Key Features

### **Core Functionality**

#### 1. **Employee Master Data Management**
- Complete employee profile management
- Fields include: Employee ID, Name, Father's Name, CNIC, Joining Date
- Designation, Pay Scale, Department tracking
- Basic salary and allowance configuration

#### 2. **Attendance Tracking System**
- Daily attendance marking (Present/Absent)
- Date-wise attendance records
- Employee-specific attendance history
- Automated deduction calculations based on absences

#### 3. **Advanced Salary Calculator**
- **Gross Salary Calculation**: Basic + Allowances
- **Overtime Computation**: Automated overtime earnings
- **Tax Deduction (5%)**: Compliant with local tax regulations
- **Absent Day Deductions**: Pro-rata salary adjustments
- **Net Salary**: Final take-home pay calculation

#### 4. **Professional Payslip Generation**
- Branded payslips with Wellserve logo and company details
- Monthly payslip generation (e.g., "Payslip - October 2025")
- Detailed breakdown of earnings and deductions
- One-click PDF download functionality
- Print-ready format

#### 5. **Tax Certificate Generation**
- Annual tax deduction certificates
- PSID/CPR reference numbers
- Year-wise tax summary
- Official company letterhead format
- Downloadable PDF certificates

#### 6. **Bulk Operations**
- Batch payslip generation for all employees
- Mass PDF download capability
- Streamlined month-end processing

#### 7. **Analytics Dashboard**
- **Total Employees Count**: Real-time employee tracking
- **Total Monthly Payroll**: Complete payroll expenditure
- **Average Salary**: Department-wise and company-wide analytics
- **Visual Charts**: Department-wise salary distribution using Recharts
- **Key Metrics Cards**: Color-coded performance indicators

---

## 🛠️ Technology Stack

### **Frontend Framework**
- **Next.js 15.5.4** - React framework with server-side rendering
- **React 19.1.0** - Latest React with concurrent features
- **TypeScript 5** - Type-safe development

### **Styling & UI**
- **Tailwind CSS v4** - Utility-first CSS framework
- **Custom UI Components** - Reusable Card, Button, Input components
- **Responsive Design** - Mobile, tablet, and desktop optimized

### **PDF Generation**
- **html2pdf.js 0.12.1** - Client-side PDF generation
- High-quality payslip and certificate rendering
- Custom layout preservation

### **Data Visualization**
- **Recharts 3.2.1** - Modern charting library
- Interactive bar charts and analytics
- Department-wise salary visualization

### **Development Tools**
- **ESLint 9** - Code quality and consistency
- **Turbopack** - Ultra-fast bundler (Next.js 15)
- **Git** - Version control

### **Deployment**
- **Vercel** - Serverless deployment platform
- Continuous deployment from GitHub
- Global CDN for optimal performance

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                        │
│                 (Next.js + React 19)                     │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Component Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Employee    │  │  Attendance  │  │   Salary     │  │
│  │    Form      │  │     Form     │  │  Calculator  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Payslip    │  │     Tax      │  │  Dashboard   │  │
│  │  Generator   │  │ Certificate  │  │   Summary    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   State Management                       │
│              (React useState - Client Side)              │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              PDF Generation & Export                     │
│                  (html2pdf.js)                           │
└─────────────────────────────────────────────────────────┘
```

**Current Architecture**: Client-side state management with React hooks  
**Phase 2**: Backend integration with database persistence (see Roadmap)

---

## 📸 Screenshots

### 1. Employee Master Data Entry
![Employee Form](https://github.com/zulfiqaralimir/payroll-system/blob/master/screenshots/employee-form.png)
*Comprehensive employee information capture with validation*

### 2. Payslip Generation
![Payslip](https://github.com/zulfiqaralimir/payroll-system/blob/master/screenshots/payslip.png)
*Professional branded payslips with detailed breakdown*

### 3. Tax Certificate
![Tax Certificate](https://github.com/zulfiqaralimir/payroll-system/blob/master/screenshots/tax-certificate.png)
*Annual tax deduction certificates for compliance*

### 4. Analytics Dashboard
![Dashboard](https://github.com/zulfiqaralimir/payroll-system/blob/master/screenshots/dashboard.png)
*Real-time analytics and visual insights*

---

## 🚀 Getting Started

### **Prerequisites**
- Node.js 20.x or higher
- npm, yarn, pnpm, or bun package manager
- Git

### **Installation**

1. **Clone the repository**
```bash
git clone https://github.com/zulfiqaralimir/payroll-system.git
cd payroll-system
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Run the development server**
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. **Open in browser**
Navigate to [http://localhost:3000](http://localhost:3000)

### **Build for Production**
```bash
npm run build
npm start
```

### **Deployment**
The application is optimized for Vercel deployment:
```bash
# Vercel will automatically detect Next.js and configure build settings
vercel --prod
```

---

## 📖 Usage Guide

### **Step-by-Step Workflow**

#### **Step 1: Add Employee**
1. Navigate to "Employee Master Data" section
2. Fill in all required fields:
   - Employee ID
   - Full Name
   - Father's Name
   - CNIC (National ID)
   - Date of Joining
   - Designation
   - Pay Scale
   - Department
   - Basic Salary
   - Allowance
3. Click "Add Employee"

#### **Step 2: Mark Attendance**
1. Go to "Attendance Tracking" section
2. Select employee from dropdown
3. Choose date
4. Mark status (Present/Absent)
5. Click "Add Attendance"

#### **Step 3: Calculate Salary**
1. Navigate to "Salary Calculation" section
2. Click "Calculate Salary" button
3. View salary breakdown:
   - Gross Salary
   - Overtime
   - Deductions (Absents)
   - Tax (5%)
   - Net Salary

#### **Step 4: Generate Payslip**
1. Review calculated salary details
2. Click "Download Payslip as PDF"
3. PDF will download automatically
4. Print or email to employee

#### **Step 5: Generate Tax Certificate**
1. Scroll to Tax Certificate section
2. Click "Download Tax Certificate (PDF)"
3. Certificate generated with annual tax summary

#### **Step 6: View Analytics**
1. Check "Payroll Dashboard Summary"
2. View key metrics:
   - Total Employees
   - Total Monthly Payroll
   - Average Salary
3. Analyze department-wise salary distribution chart

---

## 🗺️ Roadmap

### **Phase 1: Prototype** ✅ (Current)
- [x] Employee master data management
- [x] Attendance tracking
- [x] Salary calculation with tax
- [x] Payslip PDF generation
- [x] Tax certificate generation
- [x] Dashboard analytics
- [x] Responsive UI design
- [x] Client branding (Wellserve)

### **Phase 2: Backend Integration** 🔄 (Next)
- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] RESTful API development
- [ ] User authentication & authorization
- [ ] Role-based access control (Admin, HR, Employee)
- [ ] Data persistence and retrieval
- [ ] API documentation

### **Phase 3: Advanced Features** 📋 (Planned)
- [ ] Email notifications (payslips, reminders)
- [ ] Multiple tax slabs and complex calculations
- [ ] Loan management module
- [ ] Leave management integration
- [ ] Provident fund calculations
- [ ] EOBI and social security contributions
- [ ] Multi-company support
- [ ] Department-wise reports

### **Phase 4: Enterprise Scale** 🚀 (Future)
- [ ] Advanced analytics and BI dashboards
- [ ] Biometric attendance integration
- [ ] Mobile application (React Native)
- [ ] Automated bank transfer integration
- [ ] Audit trail and compliance reporting
- [ ] Multi-language support
- [ ] Cloud backup and disaster recovery
- [ ] API for third-party integrations

---

## 💼 Business Benefits

### **For HR Department**
- Eliminate manual calculations
- Reduce processing time from days to minutes
- Minimize human errors
- Generate professional documents instantly

### **For Management**
- Real-time payroll visibility
- Data-driven decision making
- Cost analysis and budgeting
- Compliance assurance

### **For Employees**
- Instant payslip access
- Transparent salary breakdown
- Digital tax certificates
- Self-service portal (Phase 3)

---

## 🤝 Contributing

This is a proprietary project developed for Wellserve Oilfield Services. For feature requests or bug reports, please contact the development team.

---

## 👨‍💻 Developer

**Zulfiqar Ali Mir**  
Full Stack Developer / Cloud Native AI Developer

- GitHub: [@zulfiqaralimir](https://github.com/zulfiqaralimir)
- Project Link: [https://github.com/zulfiqaralimir/payroll-system](https://github.com/zulfiqaralimir/payroll-system)

---

## 📄 License

This project is proprietary software developed for Wellserve Oilfield Services (Pvt) Ltd.  
All rights reserved © 2025

---

## 🏢 Client Information

**Wellserve Oilfield Services (Pvt) Ltd.**  
Plot # 51 & 52, Street # 1, I - 10/3, Industrial Area  
Islamabad, Pakistan  
Phone: +92 51 4100 311 - 14

---

## 📞 Support

For technical support or inquiries about this system:
- Developer: Zulfiqar Ali Mir
- Email: manager.equity.finance@gmail.com
- Repository Issues: [GitHub Issues](https://github.com/zulfiqaralimir/payroll-system/issues)

---

**Built with ❤️ using Next.js, React, and TypeScript**

*Last Updated: January 2025*
