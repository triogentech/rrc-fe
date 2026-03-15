import { NextRequest, NextResponse } from 'next/server';

// LetsGro tracking API – configure in .env (LETSGRO_TRACK_API_URL, LETSGRO_USERNAME, LETSGRO_PASSWORD)
const LETSGRO_BASE = process.env.LETSGRO_TRACK_API_URL ?? 'https://api.letsgro.co/api/v1/auth/pull_api';
const LETSGRO_USERNAME = process.env.LETSGRO_USERNAME ?? '';
const LETSGRO_PASSWORD = process.env.LETSGRO_PASSWORD ?? '';

/** Max response body size to avoid "Array buffer allocation failed" from huge payloads */
const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2MB

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');
  const deviceImei = searchParams.get('deviceImei');

  if (!name && !deviceImei) {
    return NextResponse.json(
      { error: 'Query param required: name (vehicle number) or deviceImei' },
      { status: 400 }
    );
  }

  if (!LETSGRO_USERNAME || !LETSGRO_PASSWORD) {
    return NextResponse.json(
      { error: 'LetsGro API credentials not configured. Set LETSGRO_USERNAME and LETSGRO_PASSWORD in .env' },
      { status: 502 }
    );
  }

  const url = new URL(LETSGRO_BASE);
  if (name) url.searchParams.set('name', name);
  if (deviceImei) url.searchParams.set('deviceImei', deviceImei);

  try {
    const auth = Buffer.from(`${LETSGRO_USERNAME}:${LETSGRO_PASSWORD}`).toString('base64');
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${auth}`,
      },
      next: { revalidate: 0 },
    });

    const contentLength = res.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: 'Tracking response too large' },
        { status: 502 }
      );
    }

    const raw = await res.text();
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: 'Tracking response too large' },
        { status: 502 }
      );
    }

    const data = (() => {
      try {
        return JSON.parse(raw);
      } catch {
        return {};
      }
    })();

    if (!res.ok) {
      return NextResponse.json(
        { error: 'LetsGro API error', details: data },
        { status: res.status >= 500 ? 502 : res.status }
      );
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error('Track API error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch tracking data' },
      { status: 502 }
    );
  }
}
