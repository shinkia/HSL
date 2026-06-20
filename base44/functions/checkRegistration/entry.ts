import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BANNED_WORDS = ['porn', 'casino', 'sex', 'viagra', 'cialis', 'gambling', 'lottery', 'escort', 'nude', 'xxx', 'fuck', 'shit'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { username, honeypot, recaptcha_token } = await req.json();

    // Get IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               req.headers.get('x-real-ip') || 'unknown';

    // Honeypot check — silently return success to bot
    if (honeypot) {
      console.warn('Honeypot triggered — suspicious IP:', ip);
      return Response.json({ allowed: true, honeypot_caught: true });
    }

    // Check rate limit (1 per minute, 5 per day per IP)
    const rateLimitResult = await base44.asServiceRole.functions.invoke('checkRateLimit', {
      identifier: ip,
      action_type: 'register',
      limits: [
        { window_minutes: 1, max_count: 1 },
        { window_minutes: 1440, max_count: 5 }
      ]
    });
    if (!rateLimitResult.data.allowed) {
      return Response.json({ allowed: false, error: '操作过于频繁，请稍后再试', retryAfter: rateLimitResult.data.retryAfter });
    }

    // Check suspicious username
    if (username) {
      const lower = username.toLowerCase();
      if (/^\d+$/.test(username)) {
        return Response.json({ allowed: false, error: '用户名不能为纯数字' });
      }
      for (const word of BANNED_WORDS) {
        if (lower.includes(word)) {
          return Response.json({ allowed: false, error: '用户名包含敏感词，请更换' });
        }
      }
    }

    // reCAPTCHA check (if configured)
    const recaptchaSecret = Deno.env.get('RECAPTCHA_SECRET_KEY');
    if (recaptchaSecret) {
      if (!recaptcha_token) {
        return Response.json({ allowed: false, error: '无法验证您的请求，请重试' });
      }
      const verifyResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${recaptchaSecret}&response=${recaptcha_token}`
      });
      const verifyData = await verifyResponse.json();
      if (!verifyData.success || (verifyData.score !== undefined && verifyData.score < 0.5)) {
        return Response.json({ allowed: false, error: '无法验证您的请求，请重试' });
      }
    } else {
      console.warn('reCAPTCHA keys not configured — protection disabled');
    }

    return Response.json({ allowed: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});