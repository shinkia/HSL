import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    // Record a failed login attempt
    await base44.asServiceRole.entities.RateLimit.create({
      identifier: email,
      action_type: 'login_failed'
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});