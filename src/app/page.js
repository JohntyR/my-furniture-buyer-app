import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AgentChat from "@/components/AgentChat";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return <AgentChat />;
}
