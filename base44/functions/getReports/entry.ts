import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin' && user.role !== 'moderator') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all reports
    const reports = await base44.asServiceRole.entities.Report.list('-created_date', 500);

    // Collect unique target IDs
    const postIds = [...new Set(reports.filter(r => r.target_type === 'post').map(r => r.target_id))];
    const commentIds = [...new Set(reports.filter(r => r.target_type === 'comment').map(r => r.target_id))];

    // Fetch users for reporter info
    const users = await base44.asServiceRole.entities.User.list();

    // Fetch referenced posts and comments
    let posts = [];
    let comments = [];

    if (postIds.length > 0) {
      const allPosts = await base44.asServiceRole.entities.Post.list(null, 500);
      posts = allPosts.filter(p => postIds.includes(p.id));
    }

    if (commentIds.length > 0) {
      const allComments = await base44.asServiceRole.entities.Comment.list(null, 500);
      comments = allComments.filter(c => commentIds.includes(c.id));
    }

    return Response.json({ reports, users, posts, comments });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});