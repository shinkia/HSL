import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { event, data, old_data, changed_fields } = body;

    if (event?.type !== 'update') return Response.json({ skipped: true });
    if (!changed_fields?.includes('status')) return Response.json({ skipped: true });
    if (data?.status !== 'approved') return Response.json({ skipped: true });
    if (old_data?.status === 'approved') return Response.json({ skipped: true });
    if (!data?.user_id) return Response.json({ skipped: true });

    const users = await base44.asServiceRole.entities.User.filter({ id: data.user_id });
    if (users.length === 0) return Response.json({ skipped: true });
    if (users[0].first_comment_approved) return Response.json({ skipped: true });

    await base44.asServiceRole.entities.User.update(data.user_id, {
      first_comment_approved: true
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});