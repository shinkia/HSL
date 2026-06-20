import React from "react";
import { Outlet } from "react-router-dom";
import Footer from "./Footer";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import { useAuth } from "@/lib/AuthContext";

export default function PublicLayout() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#FAFAFA" }}>
      <EmailVerificationBanner user={user} />
      <Outlet />
      <Footer />
    </div>
  );
}