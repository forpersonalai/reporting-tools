import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full px-3 py-3 md:px-4 lg:px-5">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1600px] w-full gap-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-6">
        <Sidebar />
        <div className="min-w-0 space-y-4 lg:space-y-6">
          <Header />
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
