import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { getPostUrl } from "@/lib/locations";

export default function OldPostRedirect() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["post-redirect", slug],
    queryFn: () => base44.entities.Post.filter({ slug, status: "published" }),
  });

  useEffect(() => {
    if (isLoading) return;
    if (posts.length > 0) {
      navigate(getPostUrl(posts[0]), { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, [posts, isLoading, navigate]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
    </div>
  );
}