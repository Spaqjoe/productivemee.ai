import { Topbar } from "./topbar";
import { SidebarExpandable } from "./sidebar-expandable";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      {/* Sidebar - full height with margins top/left/bottom */}
      <SidebarExpandable />

      {/* Right column: Topbar + Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

