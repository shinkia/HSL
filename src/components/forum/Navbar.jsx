import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Search, Menu, X, User as UserIcon, FileText, LogOut } from "lucide-react";
import Sidebar from "./Sidebar";
import { useAuth } from "@/lib/AuthContext";

export default function Navbar({ categories, tags, memberCount, onSearch }) {
  const [searchValue, setSearchValue] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchValue.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`);
    setSearchOpen(false);
  };

  const handleLogout = () => {
    logout();
  };

  const avatarUrl =
    user?.avatar ||
    (user?.username
      ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.username)}`
      : null);
  const profilePath = user?.username ? `/user/${user.username}` : "/";

  return (
    <>
      {/* TODO: Re-enable email verification banner once SMTP/email service is configured (backend phase) */}

      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          {/* Logo */}
          <Link to="/" className="shrink-0 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">论</span>
            </div>
            <span className="font-heading font-semibold text-lg hidden sm:block">社区论坛</span>
          </Link>

          {/* Search - desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-auto">
            <div className="relative w-full">
              <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Search className="h-4 w-4" />
              </button>
              <Input
                placeholder="搜索帖子..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/30"
              />
            </div>
          </form>

          {/* Auth - desktop */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full bg-muted" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {(user.username || user.email || "?")[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="text-sm font-medium max-w-[100px] truncate">
                      {user.username || user.email}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="font-normal text-xs text-muted-foreground truncate">
                    {user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(profilePath)}>
                    <UserIcon className="h-4 w-4 mr-2" />
                    个人中心
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(profilePath)}>
                    <FileText className="h-4 w-4 mr-2" />
                    我的帖子
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-sm">登录</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="text-sm bg-primary hover:bg-primary/90">注册</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile right side */}
          <div className="md:hidden flex items-center gap-1 ml-auto">
            <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => setSearchOpen(true)}>
              <Search className="h-5 w-5" />
            </Button>
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-11 w-11">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 overflow-y-auto">
                <div className="p-4 pt-14">
                  <Sidebar
                    categories={categories}
                    tags={tags}
                    memberCount={memberCount}
                    onNavigate={() => setMobileOpen(false)}
                  />
                  <div className="mt-6 pt-6 border-t space-y-2">
                    {isAuthenticated && user ? (
                      <>
                        <Link to={profilePath} onClick={() => setMobileOpen(false)}>
                          <Button variant="outline" className="w-full h-11 gap-2">
                            <UserIcon className="h-4 w-4" />
                            {user.username || "个人中心"}
                          </Button>
                        </Link>
                        <Button variant="outline" className="w-full h-11 gap-2" onClick={handleLogout}>
                          <LogOut className="h-4 w-4" />
                          退出登录
                        </Button>
                      </>
                    ) : (
                      <>
                        <Link to="/login" onClick={() => setMobileOpen(false)}>
                          <Button variant="outline" className="w-full h-11">登录</Button>
                        </Link>
                        <Link to="/register" onClick={() => setMobileOpen(false)}>
                          <Button className="w-full h-11 bg-primary hover:bg-primary/90">注册</Button>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Mobile search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] bg-background md:hidden">
          <div className="flex items-center gap-2 h-16 px-4 border-b">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Search className="h-4 w-4" />
                </button>
                <Input
                  autoFocus
                  placeholder="搜索帖子..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="pl-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/30 text-base"
                />
              </div>
            </form>
            <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0" onClick={() => setSearchOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}