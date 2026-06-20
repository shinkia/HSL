// Function invocation shim. Mimics base44.functions.invoke(name, args).
// IMPORTANT: Base44 returns { data: <result> } — every handler below must return that shape.
// Many original Base44 functions are replaced by RLS policies + triggers and don't need
// a server-side equivalent. The rest will be deployed as Supabase Edge Functions.

import { supabase } from './supabase';
import { Report } from './db';

// --- Handlers map ---
const handlers = {
  // ===== REGISTRATION / LOGIN PRE-CHECKS (stubs — proper Edge Functions later) =====
  async checkRegistration({ username, honeypot }) {
    if (honeypot) return { honeypot_caught: true, allowed: false };
    if (!username || username.length < 3 || username.length > 20 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      return { allowed: false, error: '用户名格式不正确（3-20字符，字母数字下划线）' };
    }
    return { allowed: true, honeypot_caught: false };
  },

  async preLoginCheck() {
    return { banned: false, rate_limited: false };
  },

  async recordFailedLogin() {
    return { recorded: false };
  },

  async checkRateLimit() {
    return { ok: true };
  },

  // ===== EMAIL VERIFICATION (stub — needs SMTP/Resend wiring later) =====
  async sendVerificationEmail() {
    return { sent: false, skipped: true, reason: 'email service not configured' };
  },
  async resendVerification() {
    return { sent: false, skipped: true };
  },
  async verifyEmail() {
    return { success: true, already_verified: true };
  },

  // ===== POST CREATION (routes through Supabase directly) =====
  async createPost(values) {
    const { data: au } = await supabase.auth.getUser();
    if (!au?.user) throw Object.assign(new Error('Login required'), { status: 401 });
    const payload = { ...values, user_id: au.user.id };
    const { data, error } = await supabase.from('posts').insert(payload).select('*').single();
    if (error) throw error;
    return { post: data, status: data.status };
  },

  // ===== COMMENT CREATION =====
  async createComment(values) {
    const { data: au } = await supabase.auth.getUser();
    if (!au?.user) throw Object.assign(new Error('Login required'), { status: 401 });
    // Pull username for denormalized field
    const { data: profile } = await supabase.from('profiles').select('username').eq('id', au.user.id).single();
    const payload = {
      ...values,
      user_id: au.user.id,
      author_name: profile?.username ?? 'user',
    };
    const { data, error } = await supabase.from('comments').insert(payload).select('*').single();
    if (error) throw error;
    return { comment: data };
  },

  // ===== LIKES (client-side via Reaction table; RLS handles auth) =====
  async toggleLike({ target_type, target_id }) {
    const { data: au } = await supabase.auth.getUser();
    if (!au?.user) throw Object.assign(new Error('Login required'), { status: 401 });
    const existing = await supabase
      .from('reactions')
      .select('id')
      .eq('user_id', au.user.id)
      .eq('target_type', target_type)
      .eq('target_id', target_id)
      .maybeSingle();
    if (existing.data) {
      await supabase.from('reactions').delete().eq('id', existing.data.id);
      return { liked: false };
    }
    await supabase.from('reactions').insert({ user_id: au.user.id, target_type, target_id });
    return { liked: true };
  },

  async getMyLikes({ target_type, target_ids }) {
    const { data: au } = await supabase.auth.getUser();
    if (!au?.user) return { liked: [] };
    const { data, error } = await supabase
      .from('reactions')
      .select('target_id')
      .eq('user_id', au.user.id)
      .eq('target_type', target_type)
      .in('target_id', target_ids ?? []);
    if (error) throw error;
    return { liked: data.map(r => r.target_id) };
  },

  // ===== REPORTS =====
  async submitReport({ target_type, target_id, reason, detail }) {
    return { report: await Report.create({ target_type, target_id, reason, detail }) };
  },

  async getPendingReportCount() {
    const { count, error } = await supabase
      .from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending');
    if (error) throw error;
    return { count: count ?? 0 };
  },

  async getReports({ status }) {
    let q = supabase.from('reports').select('*').order('created_at', { ascending: true });
    if (status) q = q.eq('status', status);
    const { data, error } = await q;
    if (error) throw error;
    return { reports: data };
  },

  async actionReport({ report_id, action, admin_note }) {
    const { data: au } = await supabase.auth.getUser();
    const patch = {
      status: action,
      admin_note,
      resolved_by: au?.user?.id ?? null,
      resolved_date: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('reports').update(patch).eq('id', report_id).select('*').single();
    if (error) throw error;
    return { report: data };
  },

  async getReportedUserCounts() {
    // Stubbed: future query to surface users with high report counts
    return { highReportUsers: [] };
  },

  // ===== BAN/UNBAN (stubs — admin client manipulates profiles directly via RLS) =====
  async banUser({ user_id, reason, banned_until }) {
    const { data: au } = await supabase.auth.getUser();
    const { error: pErr } = await supabase.from('profiles').update({
      banned: true, banned_reason: reason, banned_until, banned_by: au?.user?.id ?? null,
    }).eq('id', user_id);
    if (pErr) throw pErr;
    await supabase.from('ban_logs').insert({
      admin_user_id: au?.user?.id, target_user_id: user_id, action: 'ban', reason, banned_until,
    });
    return { success: true };
  },

  async unbanUser({ user_id }) {
    const { data: au } = await supabase.auth.getUser();
    const { error: pErr } = await supabase.from('profiles').update({
      banned: false, banned_reason: null, banned_until: null, banned_by: null,
    }).eq('id', user_id);
    if (pErr) throw pErr;
    await supabase.from('ban_logs').insert({
      admin_user_id: au?.user?.id, target_user_id: user_id, action: 'unban',
    });
    return { success: true };
  },

  // ===== SHARE COUNT =====
  async trackShare({ post_id }) {
    const { data: post } = await supabase.from('posts').select('share_count').eq('id', post_id).single();
    const next = (post?.share_count ?? 0) + 1;
    await supabase.from('posts').update({ share_count: next }).eq('id', post_id);
    return { share_count: next };
  },

  // ===== SYSTEM STATUS =====
  async getSystemStatus() {
    return {
      recaptcha_configured: !!import.meta.env.VITE_RECAPTCHA_SITE_KEY,
      email_configured: false,
    };
  },

  // ===== NO-OPS (handled by triggers or not needed yet) =====
  async onPostApproved() { return { ok: true }; },
  async onCommentApproved() { return { ok: true }; },
  async sitemap() { return { ok: true, note: 'sitemap deferred to Edge Function' }; },
};

export const functions = {
  async invoke(name, args = {}) {
    const handler = handlers[name];
    if (!handler) {
      // eslint-disable-next-line no-console
      console.warn(`[functions] ${name}() not yet migrated; returning empty stub.`);
      return { data: {} };
    }
    try {
      const result = await handler(args);
      return { data: result };
    } catch (e) {
      // Match Base44 SDK error shape so callers' try/catch works
      throw e;
    }
  },
};
