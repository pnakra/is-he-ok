import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getAdminStats } from "@/lib/admin-stats.functions";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Admin · Is he ok?" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function AdminPage() {
  const fetchStats = useServerFn(getAdminStats);
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => fetchStats(),
    refetchOnWindowFocus: false,
  });

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "40px 24px",
        fontFamily: "var(--font-sans)",
        color: "var(--color-foreground)",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0 }}>Admin</h1>
          <p style={{ color: "var(--color-muted-foreground)", marginTop: 4, fontSize: 14 }}>
            Last 30 days · all times UTC
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          style={{
            fontSize: 13,
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px solid var(--color-divider)",
            background: "transparent",
            color: "var(--color-foreground)",
            cursor: isFetching ? "default" : "pointer",
            opacity: isFetching ? 0.6 : 1,
          }}
        >
          {isFetching ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {isLoading && <p style={{ color: "var(--color-muted-foreground)" }}>Loading…</p>}
      {error && <p style={{ color: "crimson" }}>Failed to load stats.</p>}

      {data && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
              marginBottom: 32,
            }}
          >
            <Stat label="Sessions (30d)" value={data.totals.sessions} />
            <Stat label="Submissions (30d)" value={data.totals.submissions} />
            <Stat label="👍 Helpful" value={data.totals.feedback_up} />
            <Stat label="👎 Not helpful" value={data.totals.feedback_down} />
          </div>

          <Card title="Sessions & submissions per day">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.daily} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" />
                <XAxis dataKey="day" tickFormatter={(d) => d.slice(5)} fontSize={11} stroke="var(--color-muted-foreground)" />
                <YAxis allowDecimals={false} fontSize={11} stroke="var(--color-muted-foreground)" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sessions" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="submissions" stroke="#888" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Feedback per day">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.daily} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" />
                <XAxis dataKey="day" tickFormatter={(d) => d.slice(5)} fontSize={11} stroke="var(--color-muted-foreground)" />
                <YAxis allowDecimals={false} fontSize={11} stroke="var(--color-muted-foreground)" />
                <Tooltip />
                <Legend />
                <Bar dataKey="feedback_up" stackId="f" fill="#4ade80" name="👍" />
                <Bar dataKey="feedback_down" stackId="f" fill="#f87171" name="👎" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Daily breakdown">
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "var(--color-muted-foreground)" }}>
                    <th style={th}>Day</th>
                    <th style={th}>Sessions</th>
                    <th style={th}>Submissions</th>
                    <th style={th}>👍</th>
                    <th style={th}>👎</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.daily].reverse().map((d) => (
                    <tr key={d.day} style={{ borderTop: "1px solid var(--color-divider)" }}>
                      <td style={td}>{d.day}</td>
                      <td style={td}>{d.sessions}</td>
                      <td style={td}>{d.submissions}</td>
                      <td style={td}>{d.feedback_up}</td>
                      <td style={td}>{d.feedback_down}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

const th: React.CSSProperties = { padding: "8px 10px", fontWeight: 500 };
const td: React.CSSProperties = { padding: "8px 10px" };

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 12,
        border: "1px solid var(--color-divider)",
        background: "var(--color-background)",
      }}
    >
      <div style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, marginTop: 4 }}>{value.toLocaleString()}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        marginBottom: 28,
        padding: 20,
        borderRadius: 12,
        border: "1px solid var(--color-divider)",
        background: "var(--color-background)",
      }}
    >
      <h2 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 14px", color: "var(--color-muted-foreground)" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}
