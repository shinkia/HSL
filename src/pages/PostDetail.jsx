import React, { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getLocationBySlug, getLocationByName, getPostUrl, resolveLocationSlug } from "@/lib/locations";
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
import { Button } from "@/components/ui/button";
import { Calendar, Eye, FileX, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useAuth } from "@/lib/AuthContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import LikeButton from "@/components/forum/LikeButton";
import { useLikes } from "@/hooks/useLikes";

export default function PostDetail() {
  const { locationSlug, postSlug } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => base44.entities.Category.list("sort_order"),
  });

  const { data: tags = [] } = useQuery({
    queryKey: ["tags"],
    queryFn: () => base44.entities.Tag.list(),
  });

  const { data: posts = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["post", postSlug],
    queryFn: () => base44.entities.Post.filter({ slug: postSlug, status: "published" }),
  });

  const post = posts[0];
  const postLocation = post ? getLocationByName(post.location) : null;
  const urlLocation = getLocationBySlug(resolveLocationSlug(locationSlug));

  // Redirect if the URL location doesn't match the post's actual location
  useEffect(() => {
    if (post && postLocation && urlLocation && postLocation.slug !== urlLocation.slug) {
      navigate(getPostUrl(post), { replace: true });
    }
  }, [post, postLocation, urlLocation, navigate]);

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", post?.id],
    queryFn: () => base44.entities.Comment.filter({ post_id: post.id, status: "approved" }, "created_date"),
    enabled: !!post?.id,
  });

  const postLikedIds = useLikes("post", post ? [post.id] : []);
  const postLiked = postLikedIds.has(post?.id);
  const likedCommentIds = useLikes("comment", comments.map((c) => c.id));

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

  const { data: authorUsers = [] } = useQuery({
    queryKey: ["post-author", post?.user_id],
    queryFn: () => base44.entities.User.filter({ id: post.user_id }),
    enabled: !!post?.user_id,
  });
  const author = authorUsers[0];
  const category = categories.find((c) => c.id === post?.category_id);

  const handleDelete = async () => {
    if (!post) return;
    await base44.entities.Post.delete(post.id);
    queryClient.invalidateQueries({ queryKey: ["posts"] });
    toast({ title: "帖子已删除" });
    navigate("/");
  };
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
              ...(postLocation ? [{ label: postLocation.displayName, href: `/${postLocation.slug}` }] : []),
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
            {post.post_type === "fr" && (
              <span className="inline-block mb-2 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">心得</span>
            )}
            {post.post_type === "qna" && (
              <span className="inline-block mb-2 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded">问答</span>
            )}
            <h1 className="text-[22px] md:text-[28px] font-bold text-[#1a1a1a] leading-tight mb-4">
              {post.title}
            </h1>

            {/* Author + meta row */}
            <div className="flex items-center gap-3 mb-6">
              {author && (
                <Link to={`/user/${author.username}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  {author.avatar ? (
                    <img src={author.avatar} alt="" className="w-8 h-8 rounded-full shrink-0 bg-muted" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                      <span className="text-sm font-semibold text-primary">
                        {(author.username || "?")[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700 hover:text-primary">{author.username}</span>
                </Link>
              )}
              {!author && post.author_name && (
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
              <LikeButton targetType="post" targetId={post.id} count={post.like_count || 0} liked={postLiked} />
            </div>

            {/* Author actions */}
            {post.user_id === user?.id && (post.post_type === "fr" || post.post_type === "qna") && (
              <div className="flex gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={() => navigate(`/write?type=${post.post_type}&id=${post.id}`)}>
                  <Pencil className="h-4 w-4 mr-1" /> 编辑
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4 mr-1" /> 删除
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>确认删除？</AlertDialogTitle>
                      <AlertDialogDescription>此操作不可撤销，帖子将被永久删除。</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>删除</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}

            {/* Rich text content */}
            <div
              className="prose-content text-[#333] leading-relaxed text-[15px] mb-6"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Contact buttons — only for classified posts */}
            {post.post_type !== "fr" && post.post_type !== "qna" && (
              <div className="border-t pt-6">
                <ContactButtons post={post} />
              </div>
            )}
          </div>
        </article>

        {/* Comments */}
        <div className="bg-white rounded-2xl border shadow-sm px-4 md:px-6 py-6 mb-4">
          <CommentSection
            postId={post.id}
            comments={comments}
            likedCommentIds={likedCommentIds}
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