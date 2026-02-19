import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Job Search OS",
  description: "Job search pipeline and interview tracker",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
