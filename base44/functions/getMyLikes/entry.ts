import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ liked_ids: [] });
    }

    const { target_type, target_ids } = await req.json();
    if (!target_type || !Array.isArray(target_ids)) {
      return Response.json({ liked_ids: [] });
    }

    // Batch fetch: one query for all reactions by this user for this target type
    const reactions = await base44.asServiceRole.entities.Reaction.filter({
      user_id: user.id,
      target_type,
    }, null, 1000);

    const idSet = new Set(target_ids);
    const likedIds = reactions.filter((r) => idSet.has(r.target_id)).map((r) => r.target_id);

    return Response.json({ liked_ids: likedIds });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});