import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full p-3 lg:p-4">
      <div className="grid min-h-[calc(100vh-1.5rem)] w-full gap-4 lg:grid-cols-[288px_minmax(0,1fr)] lg:gap-5">
        <Sidebar />
        <div className="min-w-0 space-y-4 lg:space-y-5">
          <Header />
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
