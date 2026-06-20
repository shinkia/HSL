import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin' && user.role !== 'moderator') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { target_user_id } = await req.json();
    if (!target_user_id) {
      return Response.json({ error: 'target_user_id required' }, { status: 400 });
    }

    await base44.asServiceRole.entities.User.update(target_user_id, {
      banned: false,
      banned_reason: null,
      banned_until: null,
      banned_by: null
    });

    await base44.asServiceRole.entities.BanLog.create({
      admin_user_id: user.id,
      target_user_id,
      action: 'unban',
      reason: ''
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});