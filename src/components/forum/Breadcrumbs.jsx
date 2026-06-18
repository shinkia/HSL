import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

export default function Breadcrumbs({ items = [] }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6 overflow-x-auto">
      <Link to="/" className="hover:text-foreground transition-colors shrink-0">
        <Home className="h-4 w-4" />
      </Link>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          {item.href ? (
            <Link to={item.href} className="hover:text-foreground transition-colors truncate">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground truncate">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}