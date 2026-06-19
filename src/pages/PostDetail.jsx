import React from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/forum/Navbar";
import Breadcrumbs from "@/components/forum/Breadcrumbs";
import ContactButtons from "@/components/forum/ContactButtons";
import CommentSection from "@/components/forum/CommentSection";
import PostCard from "@/components/forum/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Calendar, Eye } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

const TAG_COLORS = [
  { bg: "#FEF3C7", text: "#92400E" },
  { bg: "#DBEAFE", text: "#1E40AF" },
  { bg: "#FCE7F3", text: "#9D174D" },
  { bg: "#D1FAE5", text: "#065F46" },
  { bg: "#EDE9FE", text: "#5B21B6" },
  { bg: "#FEE2E2", text: "#991B1B" },
  { bg: "#E0F2FE", text: "#075985" },
];

export default function PostDetail() {
  const { slug } = useParams();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => base44.entities.Category.list("sort_order"),
  });

  const { data: tags = [] } = useQuery({
    queryKey: ["tags"],
    queryFn: () => base44.entities.Tag.list(),
  });

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["post", slug],
    queryFn: () => base44.entities.Post.filter({ slug, status: "published" }),
  });

  const post = posts[0];

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", post?.id],
    queryFn: () => base44.entities.Comment.filter({ post_id: post.id, status: "approved" }, "created_date"),
    enabled: !!post?.id,
  });

  const { data: relatedPosts = [] } = useQuery({
    queryKey: ["related", post?.category_id, post?.id],
    queryFn: async () => {
      const all = await base44.entities.Post.filter(
        { category_id: post.category_id, status: "published" },
        "-created_date",
        5
      );
      return all.filter((p) => p.id !== post.id).slice(0, 3);
    },
    enabled: !!post?.category_id,
  });

  const category = categories.find((c) => c.id === post?.category_id);
  const postTags = (post?.tags || []).map((tid) => tags.find((t) => t.id === tid)).filter(Boolean);

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#FAFAFA" }}>
        <Navbar categories={categories} tags={tags} memberCount={0} />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Skeleton className="h-72 w-full rounded-xl mb-6" />
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-1/3 mb-8" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#FAFAFA" }}>
        <Navbar categories={categories} tags={tags} memberCount={0} />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <p className="text-lg text-gray-400">帖子不存在</p>
          <Link to="/" className="text-primary hover:underline mt-4 inline-block">返回首页</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAFAFA" }}>
      <Navbar categories={categories} tags={tags} memberCount={0} />

      <div className="max-w-3xl mx-auto px-4 py-6">
        <Breadcrumbs
          items={[
            ...(category ? [{ label: category.name, href: `/?category=${category.id}` }] : []),
            { label: post.title },
          ]}
        />

        <article className="bg-white rounded-2xl overflow-hidden shadow-sm border mb-4">
          {/* Featured image — full width */}
          {post.cover_image && (
            <div className="w-full bg-gray-100">
              <img
                src={post.cover_image}
                alt={post.title}
                className="w-full h-auto"
              />
            </div>
          )}

          <div className="px-5 sm:px-8 py-6">
            {/* Category + tags */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {category && (
                <span
                  className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full"
                  style={{
                    backgroundColor: category.color + "18",
                    color: category.color,
                    border: `1px solid ${category.color}30`,
                  }}
                >
                  {category.name}
                </span>
              )}
              {postTags.map((tag, i) => {
                const c = TAG_COLORS[i % TAG_COLORS.length];
                return (
                  <span
                    key={tag.id}
                    className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-full"
                    style={{ backgroundColor: c.bg, color: c.text }}
                  >
                    {tag.name}
                  </span>
                );
              })}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a] leading-tight mb-4">
              {post.title}
            </h1>

            {/* Author + meta row */}
            <div className="flex items-center gap-3 mb-6">
              {post.author_name && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-primary">
                      {post.author_name[0]}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{post.author_name}</span>
                </div>
              )}
              {post.created_date && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(post.created_date), "yyyy年MM月dd日", { locale: zhCN })}
                </span>
              )}
              <span className="text-xs text-gray-400 flex items-center gap-1 ml-auto">
                <Eye className="h-3.5 w-3.5" />
                {post.view_count || 0} 阅读
              </span>
            </div>

            {/* Rich text content */}
            <div
              className="prose-content text-[#333] leading-relaxed text-[15px] mb-6"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Post images (ordered) */}
            {(post.images || []).length > 0 && (
              <div className="space-y-4 mb-8">
                {post.images.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className="w-full h-auto rounded-xl bg-gray-100"
                  />
                ))}
              </div>
            )}

            {/* Contact buttons — always shown at bottom */}
            <div className="border-t pt-6">
              <ContactButtons post={post} />
            </div>
          </div>
        </article>

        {/* Comments */}
        <div className="bg-white rounded-2xl border shadow-sm px-5 sm:px-8 py-6 mb-4">
          <CommentSection
            postId={post.id}
            comments={comments}
            onCommentAdded={() => queryClient.invalidateQueries({ queryKey: ["comments", post.id] })}
          />
        </div>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h3 className="font-semibold text-gray-800">相关帖子</h3>
            </div>
            {relatedPosts.map((rp) => (
              <PostCard key={rp.id} post={rp} categories={categories} tags={tags} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}