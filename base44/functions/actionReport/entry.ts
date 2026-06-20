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

    const { report_id, action, admin_note } = await req.json();
    if (!report_id || !action) {
      return Response.json({ error: 'report_id and action are required' }, { status: 400 });
    }

    // Fetch the report
    const reports = await base44.asServiceRole.entities.Report.filter({ id: report_id });
    if (reports.length === 0) {
      return Response.json({ error: 'Report not found' }, { status: 404 });
    }
    const report = reports[0];

    const now = new Date().toISOString();
    const updateData = {
      resolved_by: user.id,
      resolved_date: now,
    };
    if (admin_note) updateData.admin_note = admin_note;

    if (action === 'delete_content') {
      // Soft-delete the content
      if (report.target_type === 'post') {
        await base44.asServiceRole.entities.Post.update(report.target_id, { status: 'archived' });
      } else {
        await base44.asServiceRole.entities.Comment.update(report.target_id, { status: 'spam' });
      }
      updateData.status = 'actioned';
    } else if (action === 'dismiss') {
      updateData.status = 'dismissed';
    } else if (action === 'review') {
      updateData.status = 'reviewed';
    } else {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    await base44.asServiceRole.entities.Report.update(report_id, updateData);

    return Response.json({ success: true, status: updateData.status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});