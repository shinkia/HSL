import React from "react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/forum/Navbar";
import Breadcrumbs from "@/components/forum/Breadcrumbs";

const PAGE_TITLES = {
  about: "关于我们",
  contact: "联系我们",
  terms: "使用条款",
  privacy: "隐私政策",
};

export default function StaticPage() {
  const location = useLocation();
  const page = location.pathname.replace("/", "");
  const title = PAGE_TITLES[page] || "页面";

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => base44.entities.Category.list("sort_order"),
  });

  const { data: tags = [] } = useQuery({
    queryKey: ["tags"],
    queryFn: () => base44.entities.Tag.list(),
  });

  return (
    <div className="flex-1 overflow-x-hidden">
      <Navbar categories={categories} tags={tags} memberCount={0} />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ label: title }]} />
        <div className="bg-white rounded-2xl border shadow-sm p-8 md:p-12 text-center">
          <h1 className="text-2xl font-bold mb-4">{title}</h1>
          <p className="text-muted-foreground">内容即将推出</p>
        </div>
      </div>
    </div>
  );
}