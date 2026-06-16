import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Green Nudges – Your Carbon Companion",
  description: "Track, reduce, and offset your carbon footprint with AI-powered personalised recommendations.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-nav">
          Skip to main content
        </a>
        <AuthProvider>
          <div id="main-content">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
