import Link from "next/link";

import { AckForm } from "./ack-form";

export default async function AlertDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem", maxWidth: 760 }}>
      <p>
        <Link href="/">Back to dashboard</Link>
      </p>
      <h1>Alert Detail (placeholder)</h1>
      <p>Alert ID: {id}</p>
      <p>
        This detail scaffold is intentionally thin. It preserves route shape for alert acknowledgement while the
        alerts read model is not implemented.
      </p>

      <section style={{ marginTop: "1rem" }}>
        <h2>Acknowledge</h2>
        <AckForm alertId={id} />
      </section>
    </main>
  );
}
