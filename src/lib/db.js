// Drop-in shim that mimics the Base44 entity API surface on top of Supabase.
// Each entity (Post, Comment, Category, Tag, MediaItem, User) exposes:
//   .list(orderBy?, limit?, offset?)
//   .filter(where, orderBy?, limit?, offset?)
//   .get(id)
//   .create(values)
//   .update(id, values)
//   .delete(id)
//
// `orderBy` can be a string like '-created_date' (Base44 prefixes '-' = desc) or 'created_date'.
// `where` is a plain object of equality filters; values that are arrays use `.in()`.

import { supabase, must } from './supabase';

const parseOrder = (orderBy) => {
  if (!orderBy) return null;
  // Base44 used 'created_date'; map to Supabase 'created_at' if needed
  const raw = orderBy.startsWith('-') ? orderBy.slice(1) : orderBy;
  const ascending = !orderBy.startsWith('-');
  const column = raw === 'created_date' ? 'created_at'
    : raw === 'updated_date' ? 'updated_at'
    : raw;
  return { column, ascending };
};

const applyWhere = (query, where = {}) => {
  for (const [k, v] of Object.entries(where)) {
    if (v === undefined) continue;
    const col = k === 'created_date' ? 'created_at' : k === 'updated_date' ? 'updated_at' : k;
    if (Array.isArray(v)) query = query.in(col, v);
    else if (v === null) query = query.is(col, null);
    else query = query.eq(col, v);
  }
  return query;
};

const makeEntity = (table) => ({
  async list(orderBy, limit, offset = 0) {
    let q = supabase.from(table).select('*');
    const order = parseOrder(orderBy);
    if (order) q = q.order(order.column, { ascending: order.ascending });
    if (limit) q = q.range(offset, offset + limit - 1);
    return must(await q);
  },
  async filter(where, orderBy, limit, offset = 0) {
    let q = supabase.from(table).select('*');
    q = applyWhere(q, where);
    const order = parseOrder(orderBy);
    if (order) q = q.order(order.column, { ascending: order.ascending });
    if (limit) q = q.range(offset, offset + limit - 1);
    return must(await q);
  },
  async get(id) {
    const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },
  async create(values) {
    return must(await supabase.from(table).insert(values).select('*').single());
  },
  async update(id, values) {
    return must(await supabase.from(table).update(values).eq('id', id).select('*').single());
  },
  async delete(id) {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },
});

// Entity mappings (Base44 entity name → Supabase table)
export const Post = makeEntity('posts');
export const Comment = makeEntity('comments');
export const Category = makeEntity('categories');
export const Tag = makeEntity('tags');
export const MediaItem = makeEntity('media_items');
export const Reaction = makeEntity('reactions');
export const Report = makeEntity('reports');
export const BanLog = makeEntity('ban_logs');

// User entity is special: backed by `profiles` table, joined with auth identity.
export const User = {
  ...makeEntity('profiles'),
  // me() — current authenticated user merged with profile
  async me() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) throw Object.assign(new Error('Not authenticated'), { status: 401 });
    const { data, error } = await supabase.from('profiles').select('*').eq('id', auth.user.id).single();
    if (error) throw error;
    return { ...data, email: auth.user.email };
  },
};
