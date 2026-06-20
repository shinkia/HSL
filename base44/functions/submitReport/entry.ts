import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { target_type, target_id, reason, detail } = await req.json();
    if (!target_type || !target_id || !reason) {
      return Response.json({ error: 'target_type, target_id, and reason are required' }, { status: 400 });
    }
    if (!['post', 'comment'].includes(target_type)) {
      return Response.json({ error: 'Invalid target_type' }, { status: 400 });
    }

    // Check for duplicate report (uniqueness enforcement)
    const existing = await base44.asServiceRole.entities.Report.filter({
      reporter_id: user.id,
      target_type,
      target_id,
    });

    if (existing.length > 0) {
      return Response.json({ already_reported: true });
    }

    // Create report
    await base44.asServiceRole.entities.Report.create({
      reporter_id: user.id,
      target_type,
      target_id,
      reason,
      detail: detail || null,
      status: 'pending',
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});