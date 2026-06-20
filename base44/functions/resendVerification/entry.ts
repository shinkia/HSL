import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.email_verified) {
      return Response.json({ already_verified: true });
    }

    // Rate limit: once per 2 minutes
    const rateLimitResult = await base44.asServiceRole.functions.invoke('checkRateLimit', {
      identifier: user.id,
      action_type: 'resend_verification',
      limits: [{ window_minutes: 2, max_count: 1 }]
    });
    if (!rateLimitResult.data.allowed) {
      return Response.json({ error: '请稍后再试', retryAfter: rateLimitResult.data.retryAfter }, { status: 429 });
    }

    // Generate new token
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await base44.asServiceRole.entities.User.update(user.id, {
      verification_token: token,
      verification_token_expires: expires
    });

    const origin = req.headers.get('origin') || '';
    const verifyUrl = `${origin}/verify?token=${token}`;

    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject: '验证您的邮箱 - 邻里荟',
        body: `您好 ${user.username || ''}，\n\n请点击以下链接验证您的邮箱：\n${verifyUrl}\n\n链接将在24小时后失效。`
      });
    } catch (emailErr) {
      console.warn('Email sending failed:', emailErr.message);
      return Response.json({ error: '邮件发送失败，请稍后重试' }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});