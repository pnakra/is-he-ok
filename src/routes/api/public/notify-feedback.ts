import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SLACK_CHANNEL_NAME = "iho_submissions";
let cachedChannelId: string | null = null;

const Body = z.object({
  sessionId: z.string().min(1).max(128),
  component: z.string().min(1).max(32),
  rating: z.string().min(1).max(32),
  note: z.string().max(1000).nullable().optional(),
  slot: z.string().max(64).nullable().optional(),
});

export const Route = createFileRoute("/api/public/notify-feedback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let json: unknown;
        try {
          json = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        const parsed = Body.safeParse(json);
        if (!parsed.success) {
          return new Response(JSON.stringify({ error: parsed.error.format() }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        const { sessionId, component, rating, note, slot } = parsed.data;

        const composedNote = [slot ? `[${slot}]` : null, note?.trim() || null]
          .filter(Boolean)
          .join(" ")
          .slice(0, 1000) || null;

        // Insert feedback row.
        try {
          await supabaseAdmin.from("iho_feedback").insert({
            session_id: sessionId,
            component,
            rating,
            note: composedNote,
          } as never);
        } catch (err) {
          console.error("[notify-feedback] insert failed", err);
        }

        // Skip slack for click telemetry.
        if (component === "resource_click") {
          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Fetch latest submission for this session for context.
        let submission: {
          sentence?: string | null;
          context?: string | null;
          analysis?: string | null;
        } | null = null;
        try {
          const { data } = await supabaseAdmin
            .from("iho_submissions")
            .select("sentence, context, analysis")
            .eq("session_id", sessionId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          submission = data;
        } catch (err) {
          console.error("[notify-feedback] submission lookup failed", err);
        }

        await notifySlack({ sessionId, component, rating, note: composedNote, submission });

        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});

async function notifySlack(input: {
  sessionId: string;
  component: string;
  rating: string;
  note: string | null;
  submission: {
    sentence?: string | null;
    context?: string | null;
    analysis?: string | null;
  } | null;
}): Promise<void> {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const slackKey = process.env.SLACK_API_KEY;
  if (!lovableKey || !slackKey) return;

  const isPositive = input.rating === "helpful";
  const emoji = isPositive ? "👍" : "👎";
  const header = `${emoji} New IHO feedback — ${input.component} (${input.rating})`;

  let parsedAnalysis: unknown = null;
  if (input.submission?.analysis) {
    try {
      parsedAnalysis = JSON.parse(input.submission.analysis);
    } catch {
      parsedAnalysis = input.submission.analysis;
    }
  }

  const blocks: unknown[] = [
    { type: "header", text: { type: "plain_text", text: header } },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Component:*\n${input.component}` },
        { type: "mrkdwn", text: `*Rating:*\n${input.rating}` },
        { type: "mrkdwn", text: `*Session:*\n\`${input.sessionId}\`` },
      ],
    },
  ];

  if (input.note) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*Why:*\n>>> ${input.note.slice(0, 2800)}` },
    });
  }

  if (input.submission?.sentence) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Submitted sentence:*\n>>> ${input.submission.sentence.slice(0, 2800)}`,
      },
    });
  }

  if (input.submission?.context) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Context:*\n>>> ${input.submission.context.slice(0, 2800)}`,
      },
    });
  }

  if (parsedAnalysis !== null) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*AI analysis:*\n\`\`\`${JSON.stringify(parsedAnalysis, null, 2).slice(0, 2800)}\`\`\``,
      },
    });
  }

  try {
    const channel = await resolveSlackChannelId(SLACK_CHANNEL_NAME, lovableKey, slackKey);
    if (!channel) {
      console.error("[notify-feedback] slack channel not found:", SLACK_CHANNEL_NAME);
      return;
    }
    const resp = await fetch("https://connector-gateway.lovable.dev/slack/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": slackKey,
      },
      body: JSON.stringify({
        channel,
        text: header,
        blocks,
        unfurl_links: false,
        unfurl_media: false,
      }),
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      console.error("[notify-feedback] slack non-ok", resp.status, body);
    } else {
      const j = (await resp.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (j && j.ok === false) {
        console.error("[notify-feedback] slack api error", j.error);
      }
    }
  } catch (err) {
    console.error("[notify-feedback] slack threw", err);
  }
}

async function resolveSlackChannelId(
  name: string,
  lovableKey: string,
  slackKey: string,
): Promise<string | null> {
  if (cachedChannelId) return cachedChannelId;
  const target = name.replace(/^#/, "").toLowerCase();

  let cursor = "";
  for (let i = 0; i < 20; i++) {
    const url = new URL("https://connector-gateway.lovable.dev/slack/api/users.conversations");
    url.searchParams.set("limit", "200");
    url.searchParams.set("types", "public_channel,private_channel");
    if (cursor) url.searchParams.set("cursor", cursor);
    const resp = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": slackKey,
      },
    });
    const json = (await resp.json().catch(() => null)) as
      | {
          ok?: boolean;
          channels?: Array<{ id: string; name: string }>;
          response_metadata?: { next_cursor?: string };
        }
      | null;
    if (!json || json.ok === false) break;
    const match = json.channels?.find((c) => c.name?.toLowerCase() === target);
    if (match) {
      cachedChannelId = match.id;
      return match.id;
    }
    cursor = json.response_metadata?.next_cursor ?? "";
    if (!cursor) break;
  }

  cursor = "";
  for (let i = 0; i < 20; i++) {
    const url = new URL("https://connector-gateway.lovable.dev/slack/api/conversations.list");
    url.searchParams.set("limit", "200");
    url.searchParams.set("types", "public_channel,private_channel");
    if (cursor) url.searchParams.set("cursor", cursor);
    const resp = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": slackKey,
      },
    });
    const json = (await resp.json().catch(() => null)) as
      | {
          ok?: boolean;
          channels?: Array<{ id: string; name: string }>;
          response_metadata?: { next_cursor?: string };
        }
      | null;
    if (!json || json.ok === false) return null;
    const match = json.channels?.find((c) => c.name?.toLowerCase() === target);
    if (match) {
      cachedChannelId = match.id;
      return match.id;
    }
    cursor = json.response_metadata?.next_cursor ?? "";
    if (!cursor) break;
  }
  return null;
}
