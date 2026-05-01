"use client";

import { useState } from "react";

type AckState = {
  status: "idle" | "submitting" | "success" | "error";
  message: string | null;
};

export function AckForm({ alertId }: { alertId: string }) {
  const [state, setState] = useState<AckState>({ status: "idle", message: null });

  async function handleAck() {
    setState({ status: "submitting", message: null });
    try {
      const response = await fetch(`/api/alerts/${alertId}/ack`, {
        method: "POST"
      });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        setState({
          status: "error",
          message: body?.message ?? `Acknowledgement failed (${response.status})`
        });
        return;
      }
      setState({
        status: "success",
        message: body?.message ?? "Acknowledgement recorded"
      });
    } catch {
      setState({
        status: "error",
        message: "Acknowledgement request failed"
      });
    }
  }

  return (
    <div>
      <button onClick={handleAck} disabled={state.status === "submitting"}>
        {state.status === "submitting" ? "Acknowledging..." : "Acknowledge alert"}
      </button>
      {state.message ? <p style={{ marginTop: "0.5rem" }}>{state.message}</p> : null}
    </div>
  );
}
