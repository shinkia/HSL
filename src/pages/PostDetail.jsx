import React from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/forum/Navbar";
import Breadcrumbs from "@/components/forum/Breadcrumbs";
import ContactButtons from "@/components/forum/ContactButtons";
import CommentSection from "@/components/forum/CommentSection";
import PostCard from "@/components/forum/PostCard";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Calendar, Eye, User } from "lucide-react";
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

  // Related posts
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
      <div className="min-h-screen bg-background">
        <Navbar categories={categories} tags={tags} memberCount={0} />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-1/3 mb-8" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar categories={categories} tags={tags} memberCount={0} />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <p className="text-lg text-muted-foreground">帖子不存在</p>
          <Link to="/" className="text-primary hover:underline mt-4 inline-block">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar categories={categories} tags={tags} memberCount={0} />

      <article className="max-w-3xl mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            ...(category ? [{ label: category.name, href: `/?category=${category.id}` }] : []),
            { label: post.title },
          ]}
        />

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {category && (
              <Badge
                variant="secondary"
                style={{
                  borderColor: category.color + "40",
                  backgroundColor: category.color + "10",
                  color: category.color,
                }}
              >
                {category.name}
              </Badge>
            )}
            {postTags.map((tag) => (
              <Badge key={tag.id} variant="outline" className="text-muted-foreground">
                {tag.name}
              </Badge>
            ))}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-4">{post.title}</h1>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {post.author_name && (
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                {post.author_name}
              </span>
            )}
            {post.created_date && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {format(new Date(post.created_date), "yyyy年MM月dd日", { locale: zhCN })}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              {post.view_count || 0} 阅读
            </span>
          </div>
        </header>

        {/* Cover image */}
        {post.cover_image && (
          <div className="rounded-xl overflow-hidden mb-8 bg-muted">
            <img src={post.cover_image} alt={post.title} className="w-full object-cover max-h-96" />
          </div>
        )}

        {/* Content */}
        <div
          className="prose-content text-foreground/90 leading-relaxed mb-10"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Contact */}
        <div className="bg-muted/50 rounded-2xl p-6 mb-10">
          <ContactButtons post={post} />
        </div>

        <Separator className="my-10" />

        {/* Comments */}
        <CommentSection
          postId={post.id}
          comments={comments}
          onCommentAdded={() => queryClient.invalidateQueries({ queryKey: ["comments", post.id] })}
        />

        {/* Related */}
        {relatedPosts.length > 0 && (
          <>
            <Separator className="my-10" />
            <div>
              <h3 className="text-lg font-semibold mb-4">相关帖子</h3>
              <div className="space-y-2">
                {relatedPosts.map((rp) => (
                  <PostCard key={rp.id} post={rp} categories={categories} tags={tags} />
                ))}
              </div>
            </div>
          </>
        )}
      </article>
    </div>
  );
}