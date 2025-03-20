import DashboardNavbar from "@/components/dashboard-navbar";
import { FileAudio, Clock, BarChart3, Users, ArrowUpRight } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "../../../supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Dashboard() {
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

  // Get recent sessions
  const { data: recentSessions } = await supabase
    .from("sessions")
    .select("*, users!sessions_counselor_id_fkey(full_name)")
    .order("created_at", { ascending: false })
    .limit(5);

  // Get session stats
  const { data: sessionCount, count } = await supabase
    .from("sessions")
    .select("id", { count: "exact", head: true });

  // Get pending sessions (for supervisors)
  const { data: pendingSessions } =
    userRole === "supervisor"
      ? await supabase
          .from("sessions")
          .select("id")
          .is("supervisor_id", null)
          .eq("status", "ready")
          .limit(1)
      : { data: [] as Array<{ id: string }> };

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Welcome Section */}
          <header className="bg-white rounded-xl p-6 border shadow-sm mb-8">
            <h1 className="text-2xl font-bold mb-2">
              Welcome, {userData?.full_name || user.email}
            </h1>
            <p className="text-gray-600">
              {userRole === "counselor"
                ? "Upload your counseling sessions and receive feedback from supervisors."
                : "Review counseling sessions and provide feedback to counselors."}
            </p>
          </header>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={<FileAudio className="h-8 w-8 text-blue-600" />}
              title="Total Sessions"
              value={count || 0}
              description="Sessions uploaded"
            />

            {userRole === "supervisor" && (
              <StatCard
                icon={<Clock className="h-8 w-8 text-amber-600" />}
                title="Pending Reviews"
                value={pendingSessions ? pendingSessions.length : 0}
                description="Sessions awaiting review"
              />
            )}

            <StatCard
              icon={<BarChart3 className="h-8 w-8 text-green-600" />}
              title="Feedback"
              value={0}
              description="Comments received"
            />

            <StatCard
              icon={<Users className="h-8 w-8 text-purple-600" />}
              title="Team"
              value={1}
              description={
                userRole === "counselor" ? "Supervisors" : "Counselors"
              }
            />
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-6 border shadow-sm mb-8">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-4">
              <Link href="/dashboard/sessions/new">
                <Button className="flex items-center gap-2">
                  <FileAudio className="h-4 w-4" />
                  Upload New Session
                </Button>
              </Link>

              {userRole === "supervisor" &&
                pendingSessions &&
                pendingSessions.length > 0 && (
                  <Link href="/dashboard/sessions">
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Clock className="h-4 w-4" />
                      Review Pending Sessions
                    </Button>
                  </Link>
                )}

              <Link href="/dashboard/analytics">
                <Button variant="outline" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  View Analytics
                </Button>
              </Link>
            </div>
          </div>

          {/* Recent Sessions */}
          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Recent Sessions</h2>
              <Link
                href="/dashboard/sessions"
                className="text-blue-600 text-sm font-medium flex items-center gap-1 hover:underline"
              >
                View All <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            {recentSessions && recentSessions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-gray-500">
                      <th className="pb-2 font-medium">Title</th>
                      <th className="pb-2 font-medium">
                        {userRole === "supervisor" ? "Counselor" : "Date"}
                      </th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSessions.map((session) => (
                      <tr
                        key={session.id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td className="py-3">
                          <Link href={`/dashboard/sessions/${session.id}`}>
                            <span className="hover:text-blue-600 hover:underline cursor-pointer">
                              {session.title}
                            </span>
                          </Link>
                        </td>
                        <td className="py-3">
                          {userRole === "supervisor"
                            ? session.users?.full_name
                            : new Date(
                                session.session_date,
                              ).toLocaleDateString()}
                        </td>
                        <td className="py-3">
                          <SessionStatus status={session.status} />
                        </td>
                        <td className="py-3">
                          <Link href={`/dashboard/sessions/${session.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>
                  No sessions found. Upload your first session to get started.
                </p>
                <Link
                  href="/dashboard/sessions/new"
                  className="mt-4 inline-block"
                >
                  <Button className="mt-2">Upload Session</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

function StatCard({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  description: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-500">{title}</h3>
          <p className="text-3xl font-bold mt-1">{value}</p>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">{icon}</div>
      </div>
    </div>
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
