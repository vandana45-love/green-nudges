"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: "📊" },
  { href: "/dashboard/planner", label: "Planner", icon: "🎚️" },
  { href: "/dashboard/coach", label: "AI Coach", icon: "🤖" },
  { href: "/dashboard/chat", label: "Chat", icon: "💬" },
];

export default function DashboardNav() {
  const path = usePathname();
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

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

      <div className="mt-auto px-2 pt-4 border-t border-gray-100">
        {user && (
          <div className="flex items-center gap-2 mb-3">
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt=""
                className="w-7 h-7 rounded-full"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">{user.displayName}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="text-xs text-gray-400 hover:text-gray-600 transition"
        >
          Sign out →
        </button>
      </div>
    </aside>
  );
}
