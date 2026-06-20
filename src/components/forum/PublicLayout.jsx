import React from "react";
import { Outlet } from "react-router-dom";
import Footer from "./Footer";

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#FAFAFA" }}>
      <Outlet />
      <Footer />
    </div>
  );
}