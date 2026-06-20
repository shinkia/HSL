// Storage helpers — replaces base44.integrations.Core.UploadFile and similar
import { supabase } from './supabase';

const SITE_URL = import.meta.env.VITE_SITE_URL || '';

const uniqueName = (originalName) => {
  const ext = originalName.includes('.') ? originalName.split('.').pop() : 'bin';
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${stamp}-${rand}.${ext}`;
};

// Upload a file to the post-images bucket. Returns { file_url, path }.
// Files are stored as {user_id}/{filename} to satisfy RLS.
export async function uploadPostImage(file) {
  const { data: au } = await supabase.auth.getUser();
  if (!au?.user) throw Object.assign(new Error('Not authenticated'), { status: 401 });
  const path = `${au.user.id}/${uniqueName(file.name)}`;
  const { error } = await supabase.storage
    .from('post-images')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  const { data: pub } = supabase.storage.from('post-images').getPublicUrl(path);
  return { file_url: pub.publicUrl, path };
}

// Upload an avatar — same logic, different bucket
export async function uploadAvatar(file) {
  const { data: au } = await supabase.auth.getUser();
  if (!au?.user) throw Object.assign(new Error('Not authenticated'), { status: 401 });
  const path = `${au.user.id}/${uniqueName(file.name)}`;
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { contentType: file.type, upsert: true });
  if (error) throw error;
  const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
  return { file_url: pub.publicUrl, path };
}

// Base44 had base44.integrations.Core.UploadFile({ file }) returning { file_url }
export const integrations = {
  Core: {
    UploadFile: async ({ file }) => uploadPostImage(file),
  },
};
