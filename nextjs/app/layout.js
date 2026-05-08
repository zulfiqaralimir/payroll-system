import "./globals.css";
import { AuthProvider } from '../lib/AuthContext';

export const metadata = {
  title: "WellServe HR Payroll",
  description: "WellServe HR Payroll System developed by Black Iron Quantum AI",
  openGraph: {
    title: "WellServe HR Payroll System",
    description: "HR Payroll Management System — WellServe Oilfield Services (Pvt) Ltd",
    type: "website",
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="description" content="WellServe HR Payroll System developed by Black Iron Quantum AI" />
        <meta property="og:title" content="WellServe HR Payroll System" />
        <meta property="og:description" content="HR Payroll Management System — WellServe Oilfield Services (Pvt) Ltd" />
      </head>
      <body className="h-full">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
