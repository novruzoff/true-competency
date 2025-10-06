import { NextResponse } from 'next/server';

const keys = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

export async function GET() {
  const env = Object.fromEntries(keys.map((k) => [k, Boolean(process.env[k])]));
  return NextResponse.json({ env, node: process.version });
}