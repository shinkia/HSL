import React, { useState } from "react";
import { Flag } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "@/components/ui/use-toast";
import ReportModal from "./ReportModal";

export default function ReportButton({ targetType, targetId }) {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({ title: "请先登录后再举报" });
      return;
    }
    setModalOpen(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
      >
        <Flag className="h-3.5 w-3.5" />
        <span>举报</span>
      </button>
      <ReportModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        targetType={targetType}
        targetId={targetId}
      />
    </>
  );
}