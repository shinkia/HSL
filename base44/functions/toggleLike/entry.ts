import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { target_type, target_id } = await req.json();
    if (!target_type || !target_id) {
      return Response.json({ error: 'target_type and target_id required' }, { status: 400 });
    }
    if (!['post', 'comment'].includes(target_type)) {
      return Response.json({ error: 'Invalid target_type' }, { status: 400 });
    }

    const targetEntity = target_type === 'post' ? 'Post' : 'Comment';

    // Check if reaction already exists (uniqueness enforcement)
    const existing = await base44.asServiceRole.entities.Reaction.filter({
      user_id: user.id,
      target_type,
      target_id,
    });

    if (existing.length > 0) {
      // Unlike: delete reaction + decrement counter
      await base44.asServiceRole.entities.Reaction.delete(existing[0].id);
      const targets = await base44.asServiceRole.entities[targetEntity].filter({ id: target_id });
      const currentCount = targets[0]?.like_count || 0;
      const newCount = Math.max(0, currentCount - 1);
      await base44.asServiceRole.entities[targetEntity].update(target_id, { like_count: newCount });
      return Response.json({ liked: false, like_count: newCount });
    } else {
      // Like: create reaction + increment counter
      await base44.asServiceRole.entities.Reaction.create({
        user_id: user.id,
        target_type,
        target_id,
      });
      const targets = await base44.asServiceRole.entities[targetEntity].filter({ id: target_id });
      const currentCount = targets[0]?.like_count || 0;
      const newCount = currentCount + 1;
      await base44.asServiceRole.entities[targetEntity].update(target_id, { like_count: newCount });
      return Response.json({ liked: true, like_count: newCount });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});