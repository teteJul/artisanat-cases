import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/connexion");
  }

  return (
    <div className="flex min-h-screen bg-sidebar">
      <AdminSidebar />
      <div className="flex-1 bg-background overflow-auto">
        {children}
      </div>
    </div>
  );
}
