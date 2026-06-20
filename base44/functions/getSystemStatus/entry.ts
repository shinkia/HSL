import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const recaptchaSecret = Deno.env.get('RECAPTCHA_SECRET_KEY');

    return Response.json({
      recaptcha: {
        configured: !!recaptchaSecret
      },
      email: {
        configured: true // Base44 SendEmail is always available
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});