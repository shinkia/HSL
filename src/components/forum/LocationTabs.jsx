import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useLocations } from "@/lib/locations";

export default function LocationTabs() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { data: locations } = useLocations();

  const tabs = [
    { label: "全部", to: "/" },
    ...locations.map((l) => ({ label: l.display_name, to: `/${l.slug}` })),
  ];

  return (
    <nav className="flex items-center gap-1 px-4 overflow-x-auto no-scrollbar">
      {tabs.map((tab) => {
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