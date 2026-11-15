import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daymark — Task Manager",
  description: "A simple workspace to plan tasks, track progress, and stay on top of timelines."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
