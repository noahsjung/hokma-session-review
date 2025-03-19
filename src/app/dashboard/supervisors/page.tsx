import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import { UserCircle, Mail, Phone, Calendar } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";

export default async function SupervisorsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get all supervisors
  const { data: supervisors } = await supabase
    .from("users")
    .select("*")
    .eq("role", "supervisor")
    .order("full_name", { ascending: true });

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Supervisors</h1>
          </div>

          {/* Supervisors List */}
          {supervisors && supervisors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {supervisors.map((supervisor) => (
                <div
                  key={supervisor.id}
                  className="bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center">
                        <UserCircle className="h-8 w-8 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">
                          {supervisor.full_name}
                        </h3>
                        <p className="text-sm text-blue-600 font-medium">
                          Supervisor
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail size={16} />
                        <span>{supervisor.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={16} />
                        <span>
                          Joined{" "}
                          {new Date(supervisor.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <Link href={`/dashboard/supervisors/${supervisor.id}`}>
                      <Button className="w-full">View Profile</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-12 border shadow-sm text-center">
              <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <UserCircle className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-medium mb-2">No supervisors found</h3>
              <p className="text-gray-500 mb-6">
                There are no supervisors available in the system yet.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
