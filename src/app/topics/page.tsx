import { supabase } from '@/lib/supabaseClient';

type Topic = { id: string; slug: string; label: string };

export default async function TopicsPage() {
  const { data, error } = await supabase
    .from('topics')
    .select('id, slug, label')
    .order('label');

  if (error) {
    return <pre className="p-6 text-red-600">Error: {error.message}</pre>;
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Topics</h1>
      <ul className="space-y-2">
        {(data as Topic[]).map(t => (
          <li key={t.id} className="px-4 py-2 rounded-lg border">
            <span className="font-medium">{t.label}</span>{' '}
            <span className="text-gray-500">#{t.slug}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
