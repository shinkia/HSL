import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check ban status
    if (user.banned) {
      const now = new Date();
      if (!user.banned_until || new Date(user.banned_until) > now) {
        return Response.json({ error: '您的账号已被封禁', banned: true, reason: user.banned_reason }, { status: 403 });
      }
    }

    // Check email verification
    if (!user.email_verified) {
      return Response.json({ error: '请先验证您的邮箱才能评论' }, { status: 403 });
    }

    // Check account age (5 minutes)
    const accountAge = Date.now() - new Date(user.created_date).getTime();
    if (accountAge < 5 * 60 * 1000) {
      return Response.json({ error: '新账号需等待5分钟后才能发帖/评论' }, { status: 403 });
    }

    // Check rate limit
    const rateLimitResult = await base44.asServiceRole.functions.invoke('checkRateLimit', {
      identifier: user.id,
      action_type: 'comment_create',
      limits: [
        { window_minutes: 60, max_count: 10 },
        { window_minutes: 1440, max_count: 100 }
      ]
    });
    if (!rateLimitResult.data.allowed) {
      return Response.json({ error: '操作过于频繁，请稍后再试', retryAfter: rateLimitResult.data.retryAfter }, { status: 429 });
    }

    const { post_id, content } = await req.json();
    if (!post_id || !content) {
      return Response.json({ error: 'post_id and content required' }, { status: 400 });
    }

    // First-comment moderation: pending until approved
    const status = user.first_comment_approved ? 'approved' : 'pending';

    const comment = await base44.asServiceRole.entities.Comment.create({
      post_id,
      content,
      user_id: user.id,
      author_name: user.username || user.full_name || user.email,
      author_email: user.email,
      status,
    });

    // Update user's comment_count
    await base44.asServiceRole.entities.User.update(user.id, {
      comment_count: (user.comment_count || 0) + 1
    });

    // Update post's reply_count
    const posts = await base44.asServiceRole.entities.Post.filter({ id: post_id });
    if (posts.length > 0) {
      await base44.asServiceRole.entities.Post.update(post_id, {
        reply_count: (posts[0].reply_count || 0) + 1
      });
    }

    return Response.json({ success: true, comment, status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});