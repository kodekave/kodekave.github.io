"use client";

import dynamic from "next/dynamic";

/**
 * The console reads the browser's storage as it starts, so it is never
 * rendered on the server. Loading it this way also keeps the editor and its
 * parser out of every other page's JavaScript.
 */
const AdminApp = dynamic(() => import("./AdminApp"), {
  ssr: false,
  loading: () => (
    <p className="label mx-auto max-w-5xl px-6 py-24 text-ink-faint">
      Loading the console…
    </p>
  ),
});

export default function AdminLoader() {
  return <AdminApp />;
}
