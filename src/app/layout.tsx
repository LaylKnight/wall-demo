import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Greg Wientjes — Wall (2008 Edition)",
  description:
    "2008-style Facebook Wall built with React 19, Next.js, Tailwind CSS, shadcn/ui, and Supabase/localStorage.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#edece8] text-[#1f1f1f] font-sans">
        {children}
      </body>
    </html>
  );
}
