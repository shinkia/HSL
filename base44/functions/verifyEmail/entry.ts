import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { token } = await req.json();

    if (!token) {
      return Response.json({ error: 'Token required' }, { status: 400 });
    }

    // Find user by token
    const users = await base44.asServiceRole.entities.User.filter({
      verification_token: token
    });

    if (users.length === 0) {
      return Response.json({ error: '无效的验证链接' }, { status: 400 });
    }

    const user = users[0];

    // Check if token is expired
    if (user.verification_token_expires && new Date(user.verification_token_expires) < new Date()) {
      return Response.json({ error: '验证链接已过期，请重新发送验证邮件' }, { status: 400 });
    }

    // Verify email
    await base44.asServiceRole.entities.User.update(user.id, {
      email_verified: true,
      verification_token: null,
      verification_token_expires: null
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});