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

    const { target_user_id, reason, banned_until } = await req.json();
    if (!target_user_id) {
      return Response.json({ error: 'target_user_id required' }, { status: 400 });
    }

    // Don't allow banning admins
    const targetUsers = await base44.asServiceRole.entities.User.filter({ id: target_user_id });
    if (targetUsers.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    if (targetUsers[0].role === 'admin') {
      return Response.json({ error: '不能封禁管理员' }, { status: 400 });
    }

    await base44.asServiceRole.entities.User.update(target_user_id, {
      banned: true,
      banned_reason: reason || '',
      banned_until: banned_until || null,
      banned_by: user.id
    });

    // Log to BanLog
    await base44.asServiceRole.entities.BanLog.create({
      admin_user_id: user.id,
      target_user_id,
      action: 'ban',
      reason: reason || '',
      banned_until: banned_until || null
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});