import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import ReportCard from "@/components/admin/ReportCard";
import { Flag } from "lucide-react";
import { getPostUrl } from "@/lib/locations";

const FILTER_TABS = [
  { label: "待处理", value: "pending" },
  { label: "已处理", value: "resolved" },
  { label: "全部", value: "all" },
];

export default function ReportsManager() {
  const [filterTab, setFilterTab] = useState("pending");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const res = await base44.functions.invoke("getReports");
      return res.data;
    },
  });

  const reports = data?.reports || [];
  const users = data?.users || [];
  const posts = data?.posts || [];
  const comments = data?.comments || [];

  // Compute pending count per target for high-priority flagging
  const pendingCountByTarget = useMemo(() => {
    const counts = {};
    reports.filter((r) => r.status === "pending").forEach((r) => {
      const key = `${r.target_type}:${r.target_id}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [reports]);

  const isHighPriority = (report) => {
    const key = `${report.target_type}:${report.target_id}`;
    return (pendingCountByTarget[key] || 0) >= 3;
  };

  // Filter reports
  let filteredReports = reports;
  if (filterTab === "pending") {
    filteredReports = reports.filter((r) => r.status === "pending");
  } else if (filterTab === "resolved") {
    filteredReports = reports.filter((r) => r.status !== "pending");
  }

  // Sort: high-priority first, then oldest first
  const sortedReports = [...filteredReports].sort((a, b) => {
    const aHigh = isHighPriority(a) ? 1 : 0;
    const bHigh = isHighPriority(b) ? 1 : 0;
    if (aHigh !== bHigh) return bHigh - aHigh;
    return new Date(a.created_date) - new Date(b.created_date);
  });

  const getReporter = (report) => users.find((u) => u.id === report.reporter_id);
  const getTargetUrl = (report) => {
    if (report.target_type === "post") {
      const post = posts.find((p) => p.id === report.target_id);
      return post ? getPostUrl(post) : null;
    } else {
      const comment = comments.find((c) => c.id === report.target_id);
      if (comment) {
        const post = posts.find((p) => p.id === comment.post_id);
        return post ? getPostUrl(post) : null;
      }
      return null;
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">举报管理</h1>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-4">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterTab(tab.value)}
            className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
              filterTab === tab.value
                ? "bg-primary text-white font-medium"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report list */}
      {isLoading && <div className="text-center py-8 text-muted-foreground">加载中...</div>}
      {isError && (
        <div className="text-center py-8">
          <p className="text-destructive mb-2">加载失败</p>
          <button onClick={refetch} className="text-primary hover:underline text-sm">重试</button>
        </div>
      )}
      {!isLoading && !isError && sortedReports.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Flag className="h-14 w-14 text-muted-foreground/30 mb-4" strokeWidth={1.5} />
          <p className="text-base font-medium text-foreground/70">暂无举报</p>
        </div>
      )}
      {!isLoading && !isError && sortedReports.length > 0 && (
        <div className="space-y-3">
          {sortedReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              reporter={getReporter(report)}
              targetUrl={getTargetUrl(report)}
              highPriority={isHighPriority(report)}
            />
          ))}
        </div>
      )}
    </div>
  );
}