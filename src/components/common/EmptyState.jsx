import React from "react";
import { Button } from "@/components/ui/button";

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction, actionIcon: ActionIcon }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && <Icon className="h-14 w-14 text-muted-foreground/30 mb-4" strokeWidth={1.5} />}
      <p className="text-base font-medium text-foreground/70 mb-1">{title}</p>
      {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="gap-2 mt-2">
          {ActionIcon && <ActionIcon className="h-4 w-4" />}
          {actionLabel}
        </Button>
      )}
    </div>
  );
}