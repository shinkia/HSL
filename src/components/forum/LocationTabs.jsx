import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LOCATIONS } from "@/lib/locations";

const TABS = [
  { label: "全部", to: "/" },
  ...LOCATIONS.map((l) => ({
    label: l.name === "Negeri Sembilan" ? "NS" : l.name,
    to: `/${l.slug}`,
  })),
];

export default function LocationTabs() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="flex items-center gap-1 px-4 overflow-x-auto no-scrollbar">
      {TABS.map((tab) => {
        const isActive =
          tab.to === "/" ? currentPath === "/" : currentPath.startsWith(tab.to);
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={`shrink-0 px-3 md:px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}