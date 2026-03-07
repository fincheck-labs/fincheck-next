import type { Metadata } from "next";
import Header from "../../components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fintech",
  description: "Fintech application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-base-100 text-base-content">
        <Header />
        {children}
      </body>
    </html>
  );
}
