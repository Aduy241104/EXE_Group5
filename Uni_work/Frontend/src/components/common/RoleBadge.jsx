import { BadgeCheck, UserRound } from "lucide-react";

export default function RoleBadge({ role, className = "" }) {
  const r = (role || "user").toLowerCase();
  if (r === "admin") {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-emerald-50 text-emerald-700 border border-emerald-100 ${className}`}>
        <BadgeCheck className="w-4 h-4" />
        Admin
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-sky-50 text-sky-700 border border-sky-100 ${className}`}>
      <UserRound className="w-4 h-4" />
      Người dùng
    </span>
  );
}
