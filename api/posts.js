import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // ---------- GET: public, returns published posts ----------
  if (req.method === 'GET') {
    const { id } = req.query;

    if (id) {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .eq('published', true)
        .single();
      if (error) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(data);
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // ---------- POST: create/update a post (requires a logged-in admin) ----------
  if (req.method === 'POST') {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    // verify the Supabase session token
    const { data: userData, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !userData?.user) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const { id, title, category, excerpt, body, read_time, published } = req.body || {};
    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    // build a URL-safe slug if no id supplied
    const slug =
      id ||
      title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const { data, error } = await supabase
      .from('blog_posts')
      .upsert({
        id: slug,
        title,
        category: category || 'Field Note',
        excerpt: excerpt || '',
        body,
        read_time: read_time || '5 min',
        published: published !== false,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
