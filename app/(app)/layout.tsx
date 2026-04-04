import { auth } from "../../auth";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <span className="font-semibold text-gray-900">Family App</span>
        <span className="text-sm text-gray-500">{session.user.name}</span>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
