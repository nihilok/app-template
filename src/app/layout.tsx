import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NextJS App Template",
  description: "Full-stack NextJS application with PostgreSQL, Better Auth, and DDD architecture",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
