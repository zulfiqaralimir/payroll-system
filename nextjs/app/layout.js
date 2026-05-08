import "./globals.css";
import { AuthProvider } from '../lib/AuthContext';

export const metadata = {
  title: "WellServe HR Payroll",
  description: "WellServe Oilfield Services — HR Payroll Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
