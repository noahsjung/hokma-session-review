"use client";

import Link from "next/link";
import { createClient } from "../../supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import {
  UserCircle,
  Home,
  Headphones,
  PlusCircle,
  LayoutDashboard,
  FileAudio,
  BarChart,
  Users,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

export default function DashboardNavbar() {
  const supabase = createClient();
  const router = useRouter();
  let pathname = "/";

  try {
    pathname = usePathname() || "/";
  } catch (error) {
    console.error("Error getting pathname:", error);
  }

  return (
    <nav className="w-full border-b border-gray-200 bg-white py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/" prefetch className="flex items-center gap-2">
            <Headphones className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold">SessionReview</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6 ml-10">
            <NavLink
              href="/dashboard"
              icon={<LayoutDashboard size={18} />}
              active={pathname === "/dashboard"}
            >
              Dashboard
            </NavLink>
            <NavLink
              href="/dashboard/sessions"
              icon={<FileAudio size={18} />}
              active={pathname.startsWith("/dashboard/sessions")}
            >
              Sessions
            </NavLink>
            <NavLink
              href="/dashboard/supervisors"
              icon={<Users size={18} />}
              active={pathname.startsWith("/dashboard/supervisors")}
            >
              Supervisors
            </NavLink>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <Link href="/dashboard/sessions/new">
            <Button size="sm" className="hidden md:flex items-center gap-1">
              <PlusCircle size={16} />
              <span>New Session</span>
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <UserCircle className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.refresh();
                }}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  children,
  icon,
  active,
}: {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${active ? "text-blue-600" : "text-gray-600 hover:text-blue-600"}`}
    >
      {icon}
      {children}
    </Link>
  );
}
