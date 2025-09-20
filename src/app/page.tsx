export default function Home() {
  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">True Competency</h1>
      <ul className="list-disc ml-6 space-y-2">
        <li>
          <a className="text-blue-600 underline" href="/signin">
            Sign in / Sign up
          </a>
        </li>
        <li>
          <a className="text-blue-600 underline" href="/topics">
            View Topics
          </a>
        </li>
        <li>
          <a className="text-blue-600 underline" href="/dashboard">
            Dashboard (protected)
          </a>
        </li>
      </ul>
    </main>
  );
}
