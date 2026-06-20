import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { identifier, action_type, limits, record = true } = await req.json();

    if (!identifier || !action_type || !Array.isArray(limits)) {
      return Response.json({ error: 'identifier, action_type, and limits array required' }, { status: 400 });
    }

    const now = new Date();
    const largestWindow = Math.max(...limits.map(l => l.window_minutes));
    const largestWindowStart = new Date(now.getTime() - largestWindow * 60 * 1000);

    const allRecords = await base44.asServiceRole.entities.RateLimit.filter({
      identifier,
      action_type,
      created_date: { $gte: largestWindowStart.toISOString() }
    });

    allRecords.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

    for (const limit of limits) {
      const windowStart = new Date(now.getTime() - limit.window_minutes * 60 * 1000);
      const recentRecords = allRecords.filter(r => new Date(r.created_date) >= windowStart);

      if (recentRecords.length >= limit.max_count) {
        const oldest = recentRecords[recentRecords.length - 1];
        const retryAfter = new Date(new Date(oldest.created_date).getTime() + limit.window_minutes * 60 * 1000);
        return Response.json({
          allowed: false,
          retryAfter: retryAfter.toISOString()
        });
      }
    }

    if (record) {
      await base44.asServiceRole.entities.RateLimit.create({ identifier, action_type });
    }

    return Response.json({ allowed: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});