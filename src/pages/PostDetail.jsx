import React from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/forum/Navbar";
import Breadcrumbs from "@/components/forum/Breadcrumbs";
import ContactButtons from "@/components/forum/ContactButtons";
import CommentSection from "@/components/forum/CommentSection";
import PostCard from "@/components/forum/PostCard";
import PostDetailSkeleton from "@/components/common/PostDetailSkeleton";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import { Calendar, Eye, FileX } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

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

  const { data: posts = [], isLoading, isError, refetch } = useQuery({
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
      <div className="flex-1 overflow-x-hidden">
        <Navbar categories={categories} tags={tags} memberCount={0} />
        <div className="max-w-3xl mx-auto px-4 py-6">
          <PostDetailSkeleton />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 overflow-x-hidden">
        <Navbar categories={categories} tags={tags} memberCount={0} />
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="bg-white rounded-2xl border shadow-sm">
            <ErrorState onRetry={refetch} />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex-1 overflow-x-hidden">
        <Navbar categories={categories} tags={tags} memberCount={0} />
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="bg-white rounded-2xl border shadow-sm">
            <EmptyState
              icon={FileX}
              title="帖子不存在"
              description="该帖子可能已被删除或链接有误"
              actionLabel="返回首页"
              onAction={() => window.location.href = "/"}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-x-hidden">
      <Navbar categories={categories} tags={tags} memberCount={0} />

      <div className="max-w-3xl mx-auto py-4 sm:py-6">
        <div className="px-4 mb-4">
          <Breadcrumbs
            items={[
              ...(category ? [{ label: category.name, href: `/category/${category.slug}` }] : []),
              { label: post.title },
            ]}
          />
        </div>

        {/* Featured image — full width edge to edge */}
        {post.cover_image && (
          <div className="w-full bg-gray-100 mb-4">
            <img
              src={post.cover_image}
              alt={post.title}
              className="w-full h-auto"
            />
          </div>
        )}

        <article className="bg-white rounded-2xl overflow-hidden shadow-sm border mb-4">
          <div className="px-4 md:px-6 py-6">
            {/* Category + tags */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {category && (
                <Link
                  to={`/category/${category.slug}`}
                  className="badge-category hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: category.color }}
                >
                  {category.name}
                </Link>
              )}
              {postTags.map((tag) => (
                <Link
                  key={tag.id}
                  to={`/tag/${tag.slug}`}
                  className="badge-tag hover:opacity-80 transition-opacity"
                >
                  {tag.name}
                </Link>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-[22px] md:text-[28px] font-bold text-[#1a1a1a] leading-tight mb-4">
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

            {/* Contact buttons — always shown at bottom */}
            <div className="border-t pt-6">
              <ContactButtons post={post} />
            </div>
          </div>
        </article>

        {/* Comments */}
        <div className="bg-white rounded-2xl border shadow-sm px-4 md:px-6 py-6 mb-4">
          <CommentSection
            postId={post.id}
            comments={comments}
            onCommentAdded={() => queryClient.invalidateQueries({ queryKey: ["comments", post.id] })}
          />
        </div>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b">
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