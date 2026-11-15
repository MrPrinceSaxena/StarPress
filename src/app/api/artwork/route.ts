import { NextRequest, NextResponse } from 'next/server';
import { resolveUser } from '@/lib/auth-resolver';
import { verifyAdminAccess } from '@/lib/admin/auth-check';
import { getAdminClient } from '@/lib/supabase/admin';
import { randomUUID } from 'crypto';
const bucket = 'customer-artwork';
export async function POST(request: NextRequest) {
  const user = await resolveUser(request);
  if (!user) return NextResponse.json({ error: 'Sign in to upload artwork.' }, { status: 401 });
  const { rateLimitDistributed } = await import('@/lib/rate-limit');
  if (!(await rateLimitDistributed(`artwork:${user.id}`, 10, 60)).success) return NextResponse.json({ error: 'Too many uploads. Try again shortly.' }, { status: 429 });
  const bytes = Buffer.from(await request.arrayBuffer());
  if (!bytes.length || bytes.length > 4 * 1024 * 1024) return NextResponse.json({ error: 'Maximum artwork size is 4 MB.' }, { status: 400 });
  const type = bytes.subarray(0, 5).toString() === '%PDF-' ? 'application/pdf' : bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'image/png' : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? 'image/jpeg' : null;
  if (!type) return NextResponse.json({ error: 'Upload a PDF, PNG or JPEG file.' }, { status: 400 });
  const path = `${user.id}/${randomUUID()}`;
  const { error } = await getAdminClient().storage.from(bucket).upload(path, bytes, { contentType: type, upsert: false });
  if (error) return NextResponse.json({ error: 'Artwork storage is unavailable.' }, { status: 503 });
  return NextResponse.json({ url: `/api/artwork?path=${encodeURIComponent(path)}` });
}
export async function GET(request: NextRequest) {
  const user = await resolveUser(request);
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  const path = request.nextUrl.searchParams.get('path') || '';
  if (!/^[a-zA-Z0-9_-]+\/[a-f0-9-]{36}$/.test(path)) return NextResponse.json({ error: 'Invalid artwork' }, { status: 400 });
  if (!path.startsWith(`${user.id}/`) && !(await verifyAdminAccess(request)).authorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { data, error } = await getAdminClient().storage.from(bucket).createSignedUrl(path, 60, { download: true });
  if (error || !data) return NextResponse.json({ error: 'Artwork unavailable' }, { status: 404 });
  return NextResponse.redirect(data.signedUrl, { headers: { 'Cache-Control': 'private, no-store' } });
}
