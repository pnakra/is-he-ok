import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface DailyStat {
  day: string; // YYYY-MM-DD
  submissions: number;
  sessions: number;
  feedback_up: number;
  feedback_down: number;
}

export const getAdminStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ daily: DailyStat[]; totals: { submissions: number; sessions: number; feedback_up: number; feedback_down: number } }> => {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - 29);
    since.setUTCHours(0, 0, 0, 0);
    const sinceIso = since.toISOString();

    const [subs, fb] = await Promise.all([
      supabaseAdmin
        .from("iho_submissions")
        .select("session_id, created_at")
        .gte("created_at", sinceIso)
        .limit(10000),
      supabaseAdmin
        .from("iho_feedback")
        .select("rating, created_at, component")
        .gte("created_at", sinceIso)
        .limit(10000),
    ]);

    const byDay = new Map<string, DailyStat>();
    // Pre-seed all 30 days so the chart is continuous.
    for (let i = 0; i < 30; i++) {
      const d = new Date(since);
      d.setUTCDate(since.getUTCDate() + i);
      const key = d.toISOString().slice(0, 10);
      byDay.set(key, { day: key, submissions: 0, sessions: 0, feedback_up: 0, feedback_down: 0 });
    }

    const sessionsByDay = new Map<string, Set<string>>();
    for (const row of subs.data ?? []) {
      const key = (row.created_at as string).slice(0, 10);
      const stat = byDay.get(key);
      if (!stat) continue;
      stat.submissions += 1;
      let set = sessionsByDay.get(key);
      if (!set) {
        set = new Set();
        sessionsByDay.set(key, set);
      }
      set.add(row.session_id as string);
    }
    for (const [key, set] of sessionsByDay) {
      const stat = byDay.get(key);
      if (stat) stat.sessions = set.size;
    }

    for (const row of fb.data ?? []) {
      // Skip click telemetry, only count thumbs.
      if ((row.component as string) === "resource_click") continue;
      const key = (row.created_at as string).slice(0, 10);
      const stat = byDay.get(key);
      if (!stat) continue;
      if (row.rating === "helpful") stat.feedback_up += 1;
      else stat.feedback_down += 1;
    }

    const daily = Array.from(byDay.values()).sort((a, b) => a.day.localeCompare(b.day));
    const totals = daily.reduce(
      (acc, d) => ({
        submissions: acc.submissions + d.submissions,
        sessions: acc.sessions + d.sessions,
        feedback_up: acc.feedback_up + d.feedback_up,
        feedback_down: acc.feedback_down + d.feedback_down,
      }),
      { submissions: 0, sessions: 0, feedback_up: 0, feedback_down: 0 },
    );

    return { daily, totals };
  },
);
