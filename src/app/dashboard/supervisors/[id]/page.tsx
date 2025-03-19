import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import { UserCircle, Mail, Calendar, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../../../../supabase/server";

export default async function SupervisorDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supervisorId = params.id;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get supervisor details
  const { data: supervisor } = await supabase
    .from("users")
    .select("*")
    .eq("id", supervisorId)
    .eq("role", "supervisor")
    .single();

  if (!supervisor) {
    return redirect("/dashboard/supervisors");
  }

  // Get sessions reviewed by this supervisor
  const { data: reviewedSessions } = await supabase
    .from("sessions")
    .select("*, users!sessions_counselor_id_fkey(full_name)")
    .eq("supervisor_id", supervisorId)
    .eq("status", "reviewed")
    .order("updated_at", { ascending: false });

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Back button */}
          <Link
            href="/dashboard/supervisors"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to Supervisors
          </Link>

          {/* Supervisor Profile */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden mb-8">
            <div className="p-8">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="bg-blue-100 rounded-full w-24 h-24 flex items-center justify-center">
                  <UserCircle className="h-12 w-12 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{supervisor.full_name}</h1>
                  <p className="text-lg text-blue-600 font-medium">
                    Supervisor
                  </p>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail size={18} />
                      <span>{supervisor.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar size={18} />
                      <span>
                        Joined{" "}
                        {new Date(supervisor.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reviewed Sessions */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Sessions Reviewed</h2>

              {reviewedSessions && reviewedSessions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-sm text-gray-500">
                        <th className="pb-2 font-medium">Title</th>
                        <th className="pb-2 font-medium">Counselor</th>
                        <th className="pb-2 font-medium">Date</th>
                        <th className="pb-2 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviewedSessions.map((session) => (
                        <tr
                          key={session.id}
                          className="border-b last:border-0 hover:bg-gray-50"
                        >
                          <td className="py-3">{session.title}</td>
                          <td className="py-3">{session.users?.full_name}</td>
                          <td className="py-3">
                            {new Date(
                              session.session_date,
                            ).toLocaleDateString()}
                          </td>
                          <td className="py-3">
                            <Link href={`/dashboard/sessions/${session.id}`}>
                              <Button variant="ghost" size="sm">
                                <FileText size={16} className="mr-1" /> View
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
                  <p>No sessions have been reviewed by this supervisor yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
