// Auth shim that mimics base44.auth.* surface using Supabase Auth
import { supabase } from './supabase';
import { User } from './db';

const SITE_URL = import.meta.env.VITE_SITE_URL || window.location.origin;

export const auth = {
  // base44.auth.me() — returns merged auth user + profile
  async me() {
    return User.me();
  },

  // base44.auth.loginViaEmailPassword — accepts ({email, password}) OR (email, password)
  async loginViaEmailPassword(emailOrObj, password) {
    const email = typeof emailOrObj === 'object' ? emailOrObj.email : emailOrObj;
    const pw = typeof emailOrObj === 'object' ? emailOrObj.password : password;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (error) throw error;
    return data.user;
  },

  // base44.auth.register — accepts ({email, password, username?}) OR (email, password, username?)
  async register(emailOrObj, password, username) {
    const obj = typeof emailOrObj === 'object' ? emailOrObj : { email: emailOrObj, password, username };
    const { data, error } = await supabase.auth.signUp({
      email: obj.email,
      password: obj.password,
      options: {
        data: obj.username ? { username: obj.username } : {},
        emailRedirectTo: `${SITE_URL}/verify`,
      },
    });
    if (error) throw error;
    return data.user;
  },

  // base44.auth.loginWithProvider('google', '/return-url')
  async loginWithProvider(provider = 'google', returnTo) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${SITE_URL}${returnTo || '/'}` },
    });
    if (error) throw error;
    return data;
  },

  // base44.auth.logout()
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // base44.auth.resetPasswordRequest — accepts ({email}) OR ("email@x.com")
  async resetPasswordRequest(emailOrObj) {
    const email = typeof emailOrObj === 'object' ? emailOrObj?.email : emailOrObj;
    if (!email) throw Object.assign(new Error('Email required'), { status: 400 });
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${SITE_URL}/reset-password`,
    });
    if (error) throw error;
  },

  // base44.auth.resetPassword — accepts ({password}|{newPassword}) OR ("newpassword")
  async resetPassword(passwordOrObj) {
    const password = typeof passwordOrObj === 'object'
      ? (passwordOrObj?.password ?? passwordOrObj?.newPassword)
      : passwordOrObj;
    if (!password) throw Object.assign(new Error('Password required'), { status: 400 });
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  },

  // base44.auth.updateMe(patch) — updates current user's profile row
  async updateMe(patch) {
    const { data: au } = await supabase.auth.getUser();
    if (!au?.user) throw Object.assign(new Error('Not authenticated'), { status: 401 });
    const { data, error } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', au.user.id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  // base44.auth.setToken(token) — legacy no-op; Supabase manages tokens internally
  setToken(_token) {},

  // base44.auth.redirectToLogin()
  redirectToLogin() {
    window.location.assign(`/login?return=${encodeURIComponent(window.location.pathname)}`);
  },

  // base44.auth.verifyOtp / resendOtp — placeholders (email OTP not used here)
  async verifyOtp() { throw new Error('verifyOtp not implemented'); },
  async resendOtp() { throw new Error('resendOtp not implemented'); },

  // Convenience: listen for auth state changes (call from AuthContext)
  onChange(cb) {
    return supabase.auth.onAuthStateChange(cb);
  },
};
