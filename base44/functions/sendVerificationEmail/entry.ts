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

    // Generate verification token
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await base44.asServiceRole.entities.User.update(user.id, {
      verification_token: token,
      verification_token_expires: expires
    });

    // Build verification URL
    const origin = req.headers.get('origin') || '';
    const verifyUrl = `${origin}/verify?token=${token}`;

    // Send email via Base44's built-in SendEmail integration
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject: '验证您的邮箱 - 邻里荟',
        body: `您好 ${user.username || ''}，\n\n请点击以下链接验证您的邮箱：\n${verifyUrl}\n\n链接将在24小时后失效。\n\n如果您没有注册账号，请忽略此邮件。`
      });
    } catch (emailErr) {
      console.warn('Email sending failed, auto-verifying user:', emailErr.message);
      // Fallback: auto-verify if email service fails
      await base44.asServiceRole.entities.User.update(user.id, {
        email_verified: true,
        verification_token: null,
        verification_token_expires: null
      });
      return Response.json({ success: true, email_sent: false, auto_verified: true });
    }

    return Response.json({ success: true, email_sent: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});