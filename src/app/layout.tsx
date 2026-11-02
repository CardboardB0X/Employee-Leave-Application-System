import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Employee Leave Application System | Cavite State University - CEIT",
  description: "Cavite State University (CvSU) College of Engineering and Information Technology - Employee Leave Application System with Strict RBAC",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-slate-50 text-slate-900 antialiased selection:bg-slate-200">
        {children}
      </body>
    </html>
  );
}
