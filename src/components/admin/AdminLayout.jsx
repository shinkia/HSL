import React from "react";
import { Link, Outlet, useLocation, Navigate } from "react-router-dom";
import { FileText, FolderOpen, Tag, Image, Users, LayoutDashboard, ArrowLeft, Flag, ShieldCheck, Loader2, ShieldAlert, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";

const navItems = [
  { path: "/admin", icon: LayoutDashboard, label: "仪表盘" },
  { path: "/admin/posts", icon: FileText, label: "帖子管理" },
  { path: "/admin/categories", icon: FolderOpen, label: "分类管理" },
  { path: "/admin/tags", icon: Tag, label: "标签管理" },
  { path: "/admin/locations", icon: MapPin, label: "地区管理" },
  { path: "/admin/media", icon: Image, label: "媒体库" },
  { path: "/admin/users", icon: Users, label: "用户管理" },
  { path: "/admin/reports", icon: Flag, label: "举报管理", badge: true },
  { path: "/admin/system-status", icon: ShieldCheck, label: "系统状态" },
];

export default function AdminLayout() {
  const { pathname } = useLocation();
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const isStaff = user?.role === "admin" || user?.role === "moderator";

  // Always call the hook (React rules); just disable for non-staff
  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["pending-report-count"],
    queryFn: async () => {
      const res = await base44.functions.invoke("getPendingReportCount");
      return res.data.count || 0;
    },
    enabled: isStaff,
  });

  // ---- Role guard (after all hooks) ----
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to={`/login?return=${encodeURIComponent(pathname)}`} replace />;
  }
  if (!isStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md text-center space-y-4">
          <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">无访问权限</h1>
          <p className="text-muted-foreground">
            管理后台仅限管理员和版主访问。如果您认为这是错误，请联系站点管理员。
          </p>
          <Button asChild>
            <Link to="/">返回首页</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 border-r bg-card flex-col shrink-0">
        <div className="p-5 border-b">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            返回论坛
          </Link>
          <h1 className="text-lg font-bold mt-3">管理后台</h1>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.path || (item.path !== "/admin" && pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {item.badge && pendingCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden border-b bg-card px-4 py-3">
          <div className="flex items-center gap-3 overflow-x-auto">
            {navItems.map((item) => {
              const active = pathname === item.path || (item.path !== "/admin" && pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap shrink-0 ${
                    active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                  {item.badge && pendingCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] px-1 rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}