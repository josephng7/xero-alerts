"use client";

import { useState, useTransition } from "react";

import { submitAlertAck, type AckFormResult } from "./ack-action";

type AckState =
  | { status: "idle"; message: string | null }
  | { status: "submitting"; message: null }
  | { status: "done"; result: AckFormResult };

export function AckForm({
  alertId,
  initiallyAcknowledged
}: {
  alertId: string;
  initiallyAcknowledged: boolean;
}) {
  const [state, setState] = useState<AckState>({ status: "idle", message: null });
  const [pending, startTransition] = useTransition();

  function handleAck() {
    setState({ status: "submitting", message: null });
    startTransition(async () => {
      const result = await submitAlertAck(alertId);
      setState({ status: "done", result });
    });
  }

  if (initiallyAcknowledged) {
    return <p>This alert is already acknowledged.</p>;
  }

  const displayMessage =
    state.status === "done"
      ? state.result.ok
        ? state.result.message
        : state.result.message
      : state.status === "idle"
        ? state.message
        : null;

  const disabled = pending || state.status === "submitting" || (state.status === "done" && state.result.ok);

  return (
    <div>
      <button type="button" onClick={handleAck} disabled={disabled}>
        {pending || state.status === "submitting" ? "Acknowledging..." : "Acknowledge alert"}
      </button>
      {displayMessage ? <p style={{ marginTop: "0.5rem" }}>{displayMessage}</p> : null}
    </div>
  );
}
