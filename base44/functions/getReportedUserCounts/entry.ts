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

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const reports = await base44.asServiceRole.entities.Report.filter({
      status: 'pending',
      created_date: { $gte: sevenDaysAgo }
    });

    const userReportCounts = {};

    for (const report of reports) {
      let targetUserId = null;
      if (report.target_type === 'post') {
        const posts = await base44.asServiceRole.entities.Post.filter({ id: report.target_id });
        if (posts.length > 0) targetUserId = posts[0].user_id;
      } else if (report.target_type === 'comment') {
        const comments = await base44.asServiceRole.entities.Comment.filter({ id: report.target_id });
        if (comments.length > 0) targetUserId = comments[0].user_id;
      }
      if (targetUserId) {
        userReportCounts[targetUserId] = (userReportCounts[targetUserId] || 0) + 1;
      }
    }

    const highReportUsers = Object.entries(userReportCounts)
      .filter(([_, count]) => count >= 3)
      .map(([userId, count]) => ({ user_id: userId, count }));

    return Response.json({ highReportUsers });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});