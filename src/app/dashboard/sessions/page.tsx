import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import { FileAudio, PlusCircle, Search } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";

export default async function SessionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get user data including role
  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  const userRole = userData?.role || "counselor";

  // Get sessions based on user role
  const { data: sessions } =
    userRole === "counselor"
      ? await supabase
          .from("sessions")
          .select("*, users!sessions_supervisor_id_fkey(full_name)")
          .eq("counselor_id", user.id)
          .order("created_at", { ascending: false })
      : await supabase
          .from("sessions")
          .select("*, users!sessions_counselor_id_fkey(full_name)")
          .or(`supervisor_id.eq.${user.id},supervisor_id.is.null`)
          .order("created_at", { ascending: false });

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Sessions</h1>
            <Link href="/dashboard/sessions/new">
              <Button className="flex items-center gap-2">
                <PlusCircle size={16} />
                <span>New Session</span>
              </Button>
            </Link>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-lg p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between border">
            <div className="relative w-full md:w-64">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search sessions..."
                className="pl-10 pr-4 py-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <select className="border rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="transcribing">Processing</option>
                <option value="ready">Ready</option>
                <option value="reviewed">Reviewed</option>
              </select>
              <select className="border rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Sessions List */}
          {sessions && sessions.length > 0 ? (
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-left text-sm text-gray-500 border-b">
                      <th className="px-6 py-3 font-medium">Title</th>
                      <th className="px-6 py-3 font-medium">
                        {userRole === "supervisor" ? "Counselor" : "Date"}
                      </th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium">Comments</th>
                      <th className="px-6 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session) => (
                      <tr
                        key={session.id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <FileAudio className="text-blue-500" size={20} />
                            <div>
                              <Link href={`/dashboard/sessions/${session.id}`}>
                                <p className="font-medium hover:text-blue-600 hover:underline cursor-pointer">
                                  {session.title}
                                </p>
                              </Link>
                              <p className="text-sm text-gray-500">
                                {new Date(
                                  session.session_date,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {userRole === "supervisor"
                            ? session.users?.full_name
                            : new Date(session.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <SessionStatus status={session.status} />
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-500">0</span>
                        </td>
                        <td className="px-6 py-4">
                          <Link href={`/dashboard/sessions/${session.id}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-12 border shadow-sm text-center">
              <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <FileAudio className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-medium mb-2">No sessions found</h3>
              <p className="text-gray-500 mb-6">
                {userRole === "counselor"
                  ? "Upload your first counseling session to get started."
                  : "There are no sessions available for review yet."}
              </p>
              {userRole === "counselor" && (
                <Link href="/dashboard/sessions/new">
                  <Button>Upload Session</Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function SessionStatus({ status }: { status: string | null }) {
  let color = "bg-gray-100 text-gray-800";
  let label = status || "Unknown";

  switch (status) {
    case "pending":
      color = "bg-yellow-100 text-yellow-800";
      break;
    case "transcribing":
      color = "bg-blue-100 text-blue-800";
      label = "Processing";
      break;
    case "ready":
      color = "bg-green-100 text-green-800";
      break;
    case "reviewed":
      color = "bg-purple-100 text-purple-800";
      break;
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}
