import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { post_id } = await req.json();
    if (!post_id) {
      return Response.json({ error: 'post_id required' }, { status: 400 });
    }

    const posts = await base44.asServiceRole.entities.Post.filter({ id: post_id });
    if (posts.length === 0) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    const newCount = (posts[0].share_count || 0) + 1;
    await base44.asServiceRole.entities.Post.update(post_id, { share_count: newCount });

    return Response.json({ success: true, share_count: newCount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});