"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: "📊" },
  { href: "/dashboard/planner", label: "Planner", icon: "🎚️" },
  { href: "/dashboard/coach", label: "AI Coach", icon: "🤖" },
  { href: "/dashboard/chat", label: "Chat", icon: "💬" },
];

export default function DashboardNav() {
  const path = usePathname();
  return (
    <aside className="w-56 shrink-0 bg-white border-r border-gray-100 min-h-screen flex flex-col p-4 gap-1">
      <div className="flex items-center gap-2 mb-6 px-2">
        <span className="text-2xl">🌿</span>
        <span className="font-bold text-brand-700 text-lg">Green Nudges</span>
      </div>
      {NAV.map(n => (
        <Link
          key={n.href}
          href={n.href}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
            path === n.href ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <span>{n.icon}</span>
          {n.label}
        </Link>
      ))}
      <div className="mt-auto px-2 pt-4">
        <UserButton afterSignOutUrl="/" />
      </div>
    </aside>
  );
}
