export type DeliveryResult = {
  status: "sent" | "skipped" | "failed";
  reason?: string;
  details?: string;
};

export async function sendTeamsNotification(params: {
  webhookUrl?: string;
  text: string;
}): Promise<DeliveryResult> {
  if (!params.webhookUrl) {
    return { status: "skipped", reason: "missing-webhook-url" };
  }

  try {
    const response = await fetch(params.webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: params.text })
    });

    if (!response.ok) {
      return {
        status: "failed",
        reason: "teams-webhook-non-2xx",
        details: `status=${response.status}`
      };
    }

    return { status: "sent" };
  } catch (error) {
    const details = error instanceof Error ? error.message : "unknown error";
    return { status: "failed", reason: "teams-webhook-error", details };
  }
}

export async function sendEmailNotification(params: {
  apiKey?: string;
  from?: string;
  to?: string;
  subject: string;
  html: string;
}): Promise<DeliveryResult> {
  if (!params.apiKey || !params.from || !params.to) {
    return { status: "skipped", reason: "missing-email-env" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${params.apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        from: params.from,
        to: [params.to],
        subject: params.subject,
        html: params.html
      })
    });

    if (!response.ok) {
      return {
        status: "failed",
        reason: "resend-non-2xx",
        details: `status=${response.status}`
      };
    }

    return { status: "sent" };
  } catch (error) {
    const details = error instanceof Error ? error.message : "unknown error";
    return { status: "failed", reason: "resend-error", details };
  }
}
