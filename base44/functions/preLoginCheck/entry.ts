import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    // Check if user is banned
    const users = await base44.asServiceRole.entities.User.filter({ email });
    if (users.length > 0) {
      const targetUser = users[0];
      if (targetUser.banned) {
        const now = new Date();
        if (!targetUser.banned_until || new Date(targetUser.banned_until) > now) {
          return Response.json({
            banned: true,
            reason: targetUser.banned_reason || '您的账号已被封禁',
            banned_until: targetUser.banned_until
          });
        }
      }
    }

    // Check login rate limit (5 failed attempts per 15 minutes) — read-only check
    const rateLimitResult = await base44.asServiceRole.functions.invoke('checkRateLimit', {
      identifier: email,
      action_type: 'login_failed',
      limits: [{ window_minutes: 15, max_count: 5 }],
      record: false
    });
    if (!rateLimitResult.data.allowed) {
      return Response.json({
        rate_limited: true,
        retryAfter: rateLimitResult.data.retryAfter
      });
    }

    return Response.json({ allowed: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});