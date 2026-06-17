import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, message } = req.body || {};

  // --- validate ---
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  // --- 1. store in Supabase (the AFTER INSERT trigger writes the audit row) ---
  const { data, error } = await supabase
    .from('connect_requests')
    .insert({ name, email, message })
    .select()
    .single();

  if (error) {
    console.error('DB insert failed:', error);
    return res.status(500).json({ error: 'Could not store message' });
  }

  // --- 2. email me via Resend (non-blocking: if it fails, the message is still saved) ---
  try {
    if (process.env.RESEND_API_KEY && process.env.CONTACT_EMAIL) {
      const safe = String(message).replace(/</g, '&lt;').replace(/>/g, '&gt;');
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Portfolio Signal <onboarding@resend.dev>',
          to: process.env.CONTACT_EMAIL,
          reply_to: email,
          subject: `📡 New signal from ${name}`,
          html: `
            <div style="font-family:system-ui,sans-serif">
              <h2 style="color:#c97d34">New contact via your portfolio</h2>
              <p><b>Name:</b> ${name}</p>
              <p><b>Email:</b> ${email}</p>
              <p><b>Message:</b></p>
              <p style="white-space:pre-wrap">${safe}</p>
            </div>`,
        }),
      });
    }
  } catch (e) {
    console.error('Email send failed (message still saved):', e);
  }

  return res.status(200).json({ ok: true, id: data.id });
}
