import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";
import CreateDummySession from "./create-dummy-session";

export default async function DummySessionRoute() {
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

  return <CreateDummySession />;
}
