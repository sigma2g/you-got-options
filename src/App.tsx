import { useState, useEffect, useCallback } from "react";

const SUPABASE_URL = "https://lfdjcpedikkihuxpggpi.supabase.co";
const SUPABASE_KEY = "sb_publishable_d2mejzY_YOjWV_E7h0s-ow_Ahr7XECY";

const db = {
  async query(table: string, method = "GET", body: any = null, filter = "") {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${filter}`, {
      method,
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: method === "POST" ? "return=representation" : "return=minimal"
      },
      body: body ? JSON.stringify(body) : null
    });
    if (!res.ok) { const e = await res.text(); throw new Error(e); }
    try { return await res.json(); } catch { return null; }
  },
  get: (table: string, filter = "") => db.query(table, "GET", null, filter),
  post: (table: string, body: any) => {
    const cleaned = Object.fromEntries(
      Object.entries(body).map(([k, v]) => [k, v === "" ? null : v])
    );
    return db.query(table, "POST", cleaned);
  },
  patch: (table: string, body: any, filter: string) => {
    const cleaned = Object.fromEntries(
      Object.entries(body).map(([k, v]) => [k, v === "" ? null : v])
    );
    return db.query(table, "PATCH", cleaned, filter);
  }
};

const INSTRUMENTS = ["AAPL","TEM","SPY","IWM","QQQ"];
const RETEST_LEVELS = ["OR level","VWAP","48 EMA","13 EMA"];
const EXIT_REASONS = ["TP1 hit","TP2 hit","Trailing stop","Stopped out","Manual exit"];

function Pill({ label, selected, onClick, color = "blue" }: any) {
  const themes: any = {
    blue: { on: { background: "var(--color-background-info)", border: "1px solid var(--color-border-info)", color: "var(--color-text-info)" }, off: { background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-secondary)", color: "var(--color-text-secondary)" } },
    green: { on: { background: "#EAF3DE", border: "1px solid #639922", color: "#3B6D11" }, off: { background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-secondary)", color: "var(--color-text-secondary)" } },
    red: { on: { background: "#FCEBEB", border: "1px solid #E24B4A", color: "#A32D2D" }, off: { background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-secondary)", color: "var(--color-text-secondary)" } },
    amber: { on: { background: "#FAEEDA", border: "1px solid #BA7517", color: "#854F0B" }, off: { background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-secondary)", color: "var(--color-text-secondary)" } },
  };
  const t = themes[color] || themes.blue;
  return (
    <button onClick={onClick} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: selected ? 500 : 400, cursor: "pointer", transition: "all 0.15s", ...(selected ? t.on : t.off) }}>
      {label}
    </button>
  );
}

function Card({ children, style = {} }: any) {
  return <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "16px", marginBottom: 12, ...style }}>{children}</div>;
}

function StatCard({ label, value, color }: any) {
  return (
    <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "12px 16px" }}>
      <p style={{ fontSize: 12, color: "var(--color-text-tertiary)", margin: "0 0 4px" }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 500, margin: 0, color: color || "var(--color-text-primary)" }}>{value}</p>
    </div>
  );
}

function Field({ label, children }: any) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: "0 0 8px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }: any) {
  return (
    <input type={type} value={value} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", boxSizing: "border-box" as any, padding: "8px 12px", fontSize: 14, borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", fontFamily: "inherit" }} />
  );
}

function Textarea({ value, onChange, placeholder, rows = 2 }: any) {
  return (
    <textarea value={value} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{ width: "100%", boxSizing: "border-box" as any, padding: "8px 12px", fontSize: 14, borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", fontFamily: "inherit", resize: "vertical" as any }} />
  );
}

function Btn({ label, onClick, variant = "primary", disabled = false }: any) {
  const styles: any = {
    primary: { background: "var(--color-background-info)", border: "0.5px solid var(--color-border-info)", color: "var(--color-text-info)" },
    secondary: { background: "transparent", border: "0.5px solid var(--color-border-secondary)", color: "var(--color-text-secondary)" },
    success: { background: "#EAF3DE", border: "0.5px solid #639922", color: "#3B6D11" },
    danger: { background: "#FCEBEB", border: "0.5px solid #E24B4A", color: "#A32D2D" },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding: "10px 20px", borderRadius: "var(--border-radius-md)", fontSize: 14, fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, ...styles[variant] }}>
      {label}
    </button>
  );
}

function Alert({ text, color = "amber" }: any) {
  const c: any = { amber: { bg: "#FAEEDA", text: "#854F0B" }, red: { bg: "#FCEBEB", text: "#A32D2D" }, green: { bg: "#EAF3DE", text: "#3B6D11" }, blue: { bg: "var(--color-background-info)", text: "var(--color-text-info)" } }[color];
  return <div style={{ padding: "10px 14px", borderRadius: "var(--border-radius-md)", background: c.bg, marginBottom: 12 }}><p style={{ margin: 0, fontSize: 13, color: c.text }}>{text}</p></div>;
}

function PillGroup({ options, value, onChange, color, multi = false }: any) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as any }}>
      {options.map((opt: string) => {
        const sel = multi ? (value || []).includes(opt) : value === opt;
        return <Pill key={opt} label={opt} selected={sel} color={color} onClick={() => {
          if (multi) { const cur = value || []; onChange(sel ? cur.filter((v: string) => v !== opt) : [...cur, opt]); }
          else onChange(opt);
        }} />;
      })}
    </div>
  );
}

function YesNo({ value, onChange }: any) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <Pill label="Yes" selected={value === "Yes"} onClick={() => onChange("Yes")} color="green" />
      <Pill label="No" selected={value === "No"} onClick={() => onChange("No")} color="red" />
    </div>
  );
}

const defaultTrade = () => ({
  ticker: "", direction: "", with_trend: "",
  or_high: "", or_low: "", break_time: "", retest_time: "", retest_level: "",
  conf_or: null, conf_vwap: null, conf_13ema: null, conf_48ema: null,
  liq_sweep: "", fib_align: "",
  confirm_tf: "", confirm_type: "", volume_supported: "",
  grade: "", entry: "", stop_loss: "", tp1: "", tp2: "", contracts: "",
  exit_price: "", exit_reason: "", pnl: "", violations: "", notes: ""
});

const defaultSession = () => ({
  date: new Date().toISOString().split("T")[0],
  bias_daily: "", bias_1hr: "", bias_15m: "",
  news_event: "", focused: "",
  session_pnl: "", followed_plan: "",
  went_well: "", needs_work: "", lesson: "", account_balance: ""
});

export default function App() {
  const [view, setView] = useState("dashboard");
  const [sessions, setSessions] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [trade, setTrade] = useState<any>(null);
  const [tradeStep, setTradeStep] = useState(0);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [mentorNote, setMentorNote] = useState<string | null>(null);

const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p] = await Promise.all([
        db.get("sessions", "?order=date.desc&limit=30"),
        db.get("trader_profile", "?limit=1")
      ]);
      setSessions(s || []);
      const raw = p?.[0] || null;
      if (raw) {
        raw.total_trades = raw.total_trades ?? 0;
        raw.win_rate = raw.win_rate ?? 0;
        raw.avg_r = raw.avg_r ?? 0;
        raw.account_baseline = raw.account_baseline ?? 0;
        raw.current_balance = raw.current_balance ?? 0;
        raw.best_instrument = raw.best_instrument ?? 'N/A';
        raw.worst_instrument = raw.worst_instrument ?? 'N/A';
        raw.best_setup = raw.best_setup ?? 'N/A';
      }
      setProfile(raw);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function upd(setter: any) { return (f: string, v: any) => setter((prev: any) => ({ ...prev, [f]: v })); }
  const updSession = upd(setSession);
  const updTrade = upd(setTrade);

  async function startSession() {
    setSession(defaultSession());
    setTrades([]);
    setSessionId(null);
    setMentorNote(null);
    setView("presession");
  }

  async function savePresession() {
    setSaving(true);
    try {
      const res = await db.post("sessions", session);
      setSessionId(res[0].id);
      setView("session");
    } catch (e: any) { setError(e.message); }
    setSaving(false);
  }

  function startTrade() {
    setTrade(defaultTrade());
    setTradeStep(0);
    setView("trade");
  }

  async function saveTrade() {
    setSaving(true);
    try {
      const payload = {
        ...trade, session_id: sessionId, date: session.date,
        or_high: parseFloat(trade.or_high) || null, or_low: parseFloat(trade.or_low) || null,
        entry: parseFloat(trade.entry) || null, stop_loss: parseFloat(trade.stop_loss) || null,
        tp1: parseFloat(trade.tp1) || null, tp2: parseFloat(trade.tp2) || null,
        exit_price: parseFloat(trade.exit_price) || null, pnl: parseFloat(trade.pnl) || null,
        contracts: parseInt(trade.contracts) || null,
        conf_or: trade.conf_or === true, conf_vwap: trade.conf_vwap === true,
        conf_13ema: trade.conf_13ema === true, conf_48ema: trade.conf_48ema === true
      };
      await db.post("trades", payload);
      setTrades([...trades, payload]);
      setTrade(null);
      setView("session");
    } catch (e: any) { setError(e.message); }
    setSaving(false);
  }

  async function analyzeAndSave() {
    setAnalysisLoading(true);
    try {
      const pnl = parseFloat(session.session_pnl) || 0;
      await db.patch("sessions", { ...session, session_pnl: pnl }, `?date=eq.${session.date}`);
      const allTrades = await db.get("trades", "?order=created_at.desc&limit=100");
      const wins = (allTrades || []).filter((t: any) => (t.pnl || 0) > 0).length;
      const total = (allTrades || []).length;
      const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
      const avgR = total > 0 ? ((allTrades || []).reduce((s: number, t: any) => s + (t.pnl || 0), 0) / total).toFixed(2) : 0;
      const byTicker: any = {};
      (allTrades || []).forEach((t: any) => { if (!byTicker[t.ticker]) byTicker[t.ticker] = []; byTicker[t.ticker].push(t.pnl || 0); });
      const tickerAvg = Object.entries(byTicker).map(([k, v]: any) => [k, v.reduce((a: number, b: number) => a + b, 0) / v.length]);
      const best = [...tickerAvg].sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || "N/A";
      const worst = [...tickerAvg].sort((a: any, b: any) => a[1] - b[1])[0]?.[0] || "N/A";

      const prompt = `You are a trading mentor for TJ McClain who trades the ORB + Retest strategy on AAPL, TEM, SPY, IWM, QQQ options.

His edge: 15m OR (9:30-9:45 EST), break + clean retest, 2/3 confluence (OR level, VWAP, 13/48 EMA on 5m), entry on 2m/5m confirmation candle. Grades: A+ (full alignment, 2 contracts), B (2/3 confluence, 1 contract), NO TRADE. Counter-trend = B max, TP1 only. Daily loss limit $50. Trailing stop $0.50 (1 contract) / $0.25 (2 contracts).

Today's session:
Date: ${session.date}
Bias: Daily ${session.bias_daily}, 1hr ${session.bias_1hr}, 15m ${session.bias_15m}
Focused: ${session.focused} | News: ${session.news_event}
Trades: ${trades.length}
${trades.map((t: any, i: number) => `Trade ${i+1}: ${t.ticker} ${t.direction} | Grade: ${t.grade} | Trend: ${t.with_trend} | Confluence: OR=${t.conf_or} VWAP=${t.conf_vwap} 13EMA=${t.conf_13ema} 48EMA=${t.conf_48ema} | Confirm: ${t.confirm_tf} ${t.confirm_type} | Entry: ${t.entry} Stop: ${t.stop_loss} TP1: ${t.tp1} | Exit: ${t.exit_price} Reason: ${t.exit_reason} P&L: $${t.pnl} | Violations: ${t.violations || "none"}`).join("\n")}
Session P&L: $${pnl}
Followed plan: ${session.followed_plan}
Went well: ${session.went_well}
Needs work: ${session.needs_work}

All-time: ${total} trades | ${winRate}% win rate | avg P&L: $${avgR} | Best: ${best} | Worst: ${worst}

Respond in this exact format. Be direct, specific, no fluff. Reference actual trades by number.

GRADE: [A/B/C/D for today's discipline]
WHAT YOU DID WELL:
[2-3 specific observations]
WHAT NEEDS WORK:
[2-3 specific weaknesses with trade references]
PATTERN I SEE:
[1-2 emerging patterns]
FOCUS FOR TOMORROW:
[1 single most important thing]`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] })
      });
      const data = await response.json();
      const analysis = data.content?.[0]?.text || "Analysis unavailable.";

      const currentProfile = await db.get("trader_profile", "?limit=1");
      const pid = currentProfile?.[0]?.id;
      if (pid) {
        await db.patch("trader_profile", {
          last_updated: new Date().toISOString(),
          total_trades: total, win_rate: winRate, avg_r: parseFloat(avgR as string),
          best_instrument: best, worst_instrument: worst,
          mentor_notes: analysis,
          current_balance: parseFloat(session.account_balance) || currentProfile[0].current_balance
        }, `?id=eq.${pid}`);
      }

      setMentorNote(analysis);
      setView("mentor");
      await load();
    } catch (e: any) { setError(e.message); }
    setAnalysisLoading(false);
  }

  const pnlColor = (v: any) => parseFloat(v) > 0 ? "#3B6D11" : parseFloat(v) < 0 ? "#A32D2D" : "var(--color-text-secondary)";
  const gradeColor = (g: string) => g === "A+" ? "#3B6D11" : g === "B" ? "#854F0B" : "#A32D2D";
  const totalPnL = sessions.reduce((s, sess) => s + (parseFloat(sess.session_pnl) || 0), 0);
  const TRADE_STEPS = ["Setup","Confluence","Confirmation","Execution","Result"];
  const confCount = trade ? [trade.conf_or, trade.conf_vwap, trade.conf_13ema, trade.conf_48ema].filter((v: any) => v === true).length : 0;

  if (loading) return <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 14 }}>Loading your trading data...</div>;
  if (error) return <div style={{ padding: "2rem" }}><Alert text={`Error: ${error}`} color="red" /><Btn label="Retry" onClick={() => { setError(null); load(); }} /></div>;

  if (view === "mentor") return (
    <div style={{ padding: "1.5rem 1rem" }}>
      <p style={{ fontSize: 18, fontWeight: 500, margin: "0 0 4px" }}>Mentor feedback</p>
      <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", margin: "0 0 20px" }}>{session?.date}</p>
      {mentorNote && (
        <Card>
          <pre style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: "inherit", color: "var(--color-text-primary)", margin: 0 }}>{mentorNote}</pre>
        </Card>
      )}
      <Btn label="Back to dashboard" onClick={() => { setView("dashboard"); setMentorNote(null); }} />
    </div>
  );

  if (view === "dashboard") return (
    <div style={{ padding: "1.5rem 1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 20, fontWeight: 500, margin: "0 0 2px" }}>You Got Options</p>
          <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", margin: 0 }}>TJ McClain · ORB + Retest</p>
        </div>
        <Btn label="+ New session" onClick={startSession} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: 20 }}>
        <StatCard label="Total P&L" value={`$${totalPnL.toFixed(2)}`} color={pnlColor(totalPnL)} />
        <StatCard label="Sessions" value={sessions.length} />
        <StatCard label="Win rate" value={profile?.win_rate ? `${profile.win_rate}%` : "—"} />
        <StatCard label="Best ticker" value={profile?.best_instrument || "—"} />
      </div>

      {profile?.mentor_notes && profile.mentor_notes !== "Profile builds as you trade. First session starts the clock." && (
        <Card style={{ borderLeft: "3px solid var(--color-border-info)", borderRadius: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Latest mentor note</p>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.6 }}>
            {profile.mentor_notes.split("\n").find((l: string) => l.startsWith("FOCUS FOR TOMORROW:"))?.replace("FOCUS FOR TOMORROW:", "").trim() || profile.mentor_notes.slice(0, 180) + "..."}
          </p>
        </Card>
      )}

      {sessions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--color-text-tertiary)", fontSize: 14 }}>
          No sessions yet. Hit "New session" to start.
        </div>
      ) : sessions.map((s: any) => (
        <Card key={s.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontWeight: 500, fontSize: 14 }}>{s.date}</span>
            <span style={{ fontWeight: 500, fontSize: 14, color: pnlColor(s.session_pnl) }}>
              {s.session_pnl != null ? `$${parseFloat(s.session_pnl).toFixed(2)}` : "—"}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as any }}>
            {s.bias_daily && <span style={{ fontSize: 12, padding: "2px 10px", borderRadius: 12, background: s.bias_daily === "Bullish" ? "#EAF3DE" : s.bias_daily === "Bearish" ? "#FCEBEB" : "#FAEEDA", color: s.bias_daily === "Bullish" ? "#3B6D11" : s.bias_daily === "Bearish" ? "#A32D2D" : "#854F0B" }}>D: {s.bias_daily}</span>}
            {s.followed_plan && <span style={{ fontSize: 12, padding: "2px 10px", borderRadius: 12, background: "var(--color-background-secondary)", color: "var(--color-text-secondary)" }}>Plan: {s.followed_plan}</span>}
          </div>
        </Card>
      ))}
    </div>
  );

  if (view === "presession") return (
    <div style={{ padding: "1.5rem 1rem" }}>
      <p style={{ fontSize: 18, fontWeight: 500, margin: "0 0 4px" }}>Pre-session</p>
      <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", margin: "0 0 24px" }}>Set your bias before 9:30. Takes 2 minutes.</p>
      <Field label="Daily bias">
        <PillGroup options={["Bullish","Bearish","Neutral"]} value={session.bias_daily} onChange={(v: string) => updSession("bias_daily", v)} color={session.bias_daily === "Bullish" ? "green" : session.bias_daily === "Bearish" ? "red" : "amber"} />
      </Field>
      <Field label="1hr bias">
        <PillGroup options={["Bullish","Bearish","Neutral"]} value={session.bias_1hr} onChange={(v: string) => updSession("bias_1hr", v)} color={session.bias_1hr === "Bullish" ? "green" : session.bias_1hr === "Bearish" ? "red" : "amber"} />
      </Field>
      <Field label="15m bias">
        <PillGroup options={["Bullish","Bearish","Neutral"]} value={session.bias_15m} onChange={(v: string) => updSession("bias_15m", v)} color={session.bias_15m === "Bullish" ? "green" : session.bias_15m === "Bearish" ? "red" : "amber"} />
      </Field>
      <Field label="Focused and clear?"><YesNo value={session.focused} onChange={(v: string) => updSession("focused", v)} /></Field>
      <Field label="High-impact news today?"><YesNo value={session.news_event} onChange={(v: string) => updSession("news_event", v)} /></Field>
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <Btn label="Cancel" onClick={() => setView("dashboard")} variant="secondary" />
        <Btn label="Start session →" onClick={savePresession} disabled={saving} />
      </div>
    </div>
  );

  if (view === "session") return (
    <div style={{ padding: "1.5rem 1rem" }}>
      <p style={{ fontSize: 18, fontWeight: 500, margin: "0 0 4px" }}>Session — {session?.date}</p>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" as any }}>
        {[session?.bias_daily, session?.bias_1hr, session?.bias_15m].filter(Boolean).map((b: string, i: number) => (
          <span key={i} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 12, background: b === "Bullish" ? "#EAF3DE" : b === "Bearish" ? "#FCEBEB" : "#FAEEDA", color: b === "Bullish" ? "#3B6D11" : b === "Bearish" ? "#A32D2D" : "#854F0B" }}>
            {["D","1h","15m"][i]}: {b}
          </span>
        ))}
        <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 12, background: "var(--color-background-secondary)", color: "var(--color-text-tertiary)" }}>{trades.length}/3 trades · $50 max</span>
      </div>

      {trades.map((t: any, i: number) => (
        <Card key={i} style={{ background: "var(--color-background-secondary)" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 500, fontSize: 14 }}>Trade {i+1} · {t.ticker} {t.direction}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: gradeColor(t.grade) }}>{t.grade}</span>
          </div>
          <p style={{ fontSize: 13, color: pnlColor(t.pnl), margin: "4px 0 0", fontWeight: 500 }}>
            {t.pnl != null ? `$${parseFloat(t.pnl).toFixed(2)}` : "—"} · {t.exit_reason || "pending"}
          </p>
        </Card>
      ))}

      {trades.length < 3 && (
        <button onClick={startTrade} style={{ width: "100%", padding: "12px", borderRadius: "var(--border-radius-md)", border: "0.5px dashed var(--color-border-secondary)", background: "transparent", color: "var(--color-text-secondary)", fontSize: 14, cursor: "pointer", marginBottom: 16 }}>
          + Log a trade
        </button>
      )}

      <Card>
        <p style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 14px" }}>Post-session review</p>
        <Field label="Session P&L ($)"><Input value={session.session_pnl} onChange={(v: string) => updSession("session_pnl", v)} placeholder="e.g. 45 or -50" type="number" /></Field>
        <Field label="Followed the plan?">
          <PillGroup options={["Yes","Mostly","No"]} value={session.followed_plan} onChange={(v: string) => updSession("followed_plan", v)} color={session.followed_plan === "Yes" ? "green" : session.followed_plan === "No" ? "red" : "amber"} />
        </Field>
        <Field label="What went well?"><Textarea value={session.went_well} onChange={(v: string) => updSession("went_well", v)} placeholder="One thing that worked" /></Field>
        <Field label="What needs work?"><Textarea value={session.needs_work} onChange={(v: string) => updSession("needs_work", v)} placeholder="One thing to fix" /></Field>
        <Field label="One lesson"><Textarea value={session.lesson} onChange={(v: string) => updSession("lesson", v)} placeholder="Most important takeaway" /></Field>
        <Field label="Account balance EOD ($)"><Input value={session.account_balance} onChange={(v: string) => updSession("account_balance", v)} type="number" placeholder="e.g. 1250" /></Field>
      </Card>

      <Btn label={analysisLoading ? "Getting mentor feedback..." : "Save + get mentor feedback"} onClick={analyzeAndSave} disabled={analysisLoading || !session.session_pnl} variant="success" />
      {!session.session_pnl && <p style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginTop: 6 }}>Enter session P&L to save</p>}
    </div>
  );

  if (view === "trade") return (
    <div style={{ padding: "1.5rem 1rem" }}>
      <div style={{ display: "flex", marginBottom: 20 }}>
        {TRADE_STEPS.map((s, i) => (
          <div key={s} style={{ flex: 1, textAlign: "center", cursor: "pointer" }} onClick={() => setTradeStep(i)}>
            <div style={{ height: 3, background: i <= tradeStep ? "var(--color-border-info)" : "var(--color-border-tertiary)", marginBottom: 5 }} />
            <span style={{ fontSize: 11, color: i === tradeStep ? "var(--color-text-info)" : "var(--color-text-tertiary)" }}>{s}</span>
          </div>
        ))}
      </div>

      {tradeStep === 0 && (
        <div>
          <Field label="Instrument"><PillGroup options={INSTRUMENTS} value={trade.ticker} onChange={(v: string) => updTrade("ticker", v)} /></Field>
          <Field label="Direction">
            <div style={{ display: "flex", gap: 8 }}>
              <Pill label="Long" selected={trade.direction === "Long"} onClick={() => updTrade("direction", "Long")} color="green" />
              <Pill label="Short" selected={trade.direction === "Short"} onClick={() => updTrade("direction", "Short")} color="red" />
            </div>
          </Field>
          <Field label="With or against trend?">
            <div style={{ display: "flex", gap: 8 }}>
              <Pill label="With trend" selected={trade.with_trend === "With"} onClick={() => updTrade("with_trend", "With")} color="green" />
              <Pill label="Counter-trend" selected={trade.with_trend === "Counter"} onClick={() => updTrade("with_trend", "Counter")} color="amber" />
            </div>
          </Field>
          {trade.with_trend === "Counter" && <Alert text="Counter-trend: max grade B. Target TP1 only." color="amber" />}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="OR High"><Input value={trade.or_high} onChange={(v: string) => updTrade("or_high", v)} placeholder="0.00" type="number" /></Field>
            <Field label="OR Low"><Input value={trade.or_low} onChange={(v: string) => updTrade("or_low", v)} placeholder="0.00" type="number" /></Field>
            <Field label="Break time"><Input value={trade.break_time} onChange={(v: string) => updTrade("break_time", v)} placeholder="9:52" /></Field>
            <Field label="Retest time"><Input value={trade.retest_time} onChange={(v: string) => updTrade("retest_time", v)} placeholder="10:05" /></Field>
          </div>
          <Field label="Retest held at"><PillGroup options={RETEST_LEVELS} value={trade.retest_level} onChange={(v: string) => updTrade("retest_level", v)} /></Field>
        </div>
      )}

      {tradeStep === 1 && (
        <div>
          <p style={{ fontSize: 14, color: "var(--color-text-secondary)", margin: "0 0 16px" }}>Need at least 2 of 3 to take the trade.</p>
          {[["OR level aligned","conf_or"],["VWAP aligned","conf_vwap"],["48 EMA aligned","conf_48ema"],["13 EMA aligned","conf_13ema"]].map(([label, field]) => (
            <div key={field} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
              <span style={{ fontSize: 14 }}>{label}</span>
              <YesNo value={trade[field] === true ? "Yes" : trade[field] === false ? "No" : ""} onChange={(v: string) => updTrade(field, v === "Yes")} />
            </div>
          ))}
          <div style={{ marginTop: 12 }}>
            {confCount >= 2 ? <Alert text={`${confCount} confluence factors — valid setup`} color="green" /> : <Alert text={`${confCount} confluence factor${confCount === 1 ? "" : "s"} — need at least 2`} color="red" />}
          </div>
          <p style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "16px 0 10px" }}>Enhancements (optional)</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
            <span style={{ fontSize: 14 }}>Liquidity sweep?</span>
            <YesNo value={trade.liq_sweep} onChange={(v: string) => updTrade("liq_sweep", v)} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0" }}>
            <span style={{ fontSize: 14 }}>Fibonacci alignment?</span>
            <YesNo value={trade.fib_align} onChange={(v: string) => updTrade("fib_align", v)} />
          </div>
        </div>
      )}

      {tradeStep === 2 && (
        <div>
          <p style={{ fontSize: 14, color: "var(--color-text-secondary)", margin: "0 0 16px" }}>No confirmation = NO TRADE.</p>
          <Field label="Confirmation timeframe">
            <div style={{ display: "flex", gap: 8 }}>
              <Pill label="2m" selected={trade.confirm_tf === "2m"} onClick={() => updTrade("confirm_tf", "2m")} />
              <Pill label="5m" selected={trade.confirm_tf === "5m"} onClick={() => updTrade("confirm_tf", "5m")} />
              <Pill label="None" selected={trade.confirm_tf === "None"} onClick={() => updTrade("confirm_tf", "None")} color="red" />
            </div>
          </Field>
          {trade.confirm_tf === "None" && <Alert text="No confirmation = NO TRADE. Do not enter." color="red" />}
          <Field label="Candle type">
            <div style={{ display: "flex", gap: 8 }}>
              <Pill label="2-candle reversal" selected={trade.confirm_type === "2-candle"} onClick={() => updTrade("confirm_type", "2-candle")} />
              <Pill label="Power candle" selected={trade.confirm_type === "Power"} onClick={() => updTrade("confirm_type", "Power")} />
            </div>
          </Field>
          <Field label="Volume supported?"><YesNo value={trade.volume_supported} onChange={(v: string) => updTrade("volume_supported", v)} /></Field>
          <Field label="Trade grade">
            <div style={{ display: "flex", gap: 8 }}>
              {["A+","B","NO TRADE"].map(g => (
                <Pill key={g} label={g} selected={trade.grade === g} onClick={() => updTrade("grade", g)} color={g === "A+" ? "green" : g === "B" ? "amber" : "red"} />
              ))}
            </div>
          </Field>
          {trade.with_trend === "Counter" && trade.grade === "A+" && <Alert text="Counter-trend trades are B max. Downgrade to B." color="amber" />}
        </div>
      )}

      {tradeStep === 3 && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Entry price"><Input value={trade.entry} onChange={(v: string) => updTrade("entry", v)} placeholder="0.00" type="number" /></Field>
            <Field label="Stop loss"><Input value={trade.stop_loss} onChange={(v: string) => updTrade("stop_loss", v)} placeholder="0.00" type="number" /></Field>
            <Field label="TP1 (~1.5R)"><Input value={trade.tp1} onChange={(v: string) => updTrade("tp1", v)} placeholder="0.00" type="number" /></Field>
            <Field label="TP2 (2–3R)"><Input value={trade.tp2} onChange={(v: string) => updTrade("tp2", v)} placeholder="A+ only" type="number" /></Field>
          </div>
          <Field label="Contracts">
            <div style={{ display: "flex", gap: 8 }}>
              <Pill label="1 contract · $50 risk" selected={trade.contracts === "1"} onClick={() => updTrade("contracts", "1")} />
              <Pill label="2 contracts · $25 each" selected={trade.contracts === "2"} onClick={() => updTrade("contracts", "2")} color={trade.grade === "A+" ? "green" : "amber"} />
            </div>
          </Field>
          {trade.contracts === "2" && trade.grade !== "A+" && <Alert text="2 contracts for A+ setups only." color="red" />}
          <Field label="Any rule violations?"><Textarea value={trade.violations} onChange={(v: string) => updTrade("violations", v)} placeholder="None, or describe what was broken" /></Field>
        </div>
      )}

      {tradeStep === 4 && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Exit price"><Input value={trade.exit_price} onChange={(v: string) => updTrade("exit_price", v)} placeholder="0.00" type="number" /></Field>
            <Field label="P&L ($)"><Input value={trade.pnl} onChange={(v: string) => updTrade("pnl", v)} placeholder="e.g. 45 or -50" type="number" /></Field>
          </div>
          <Field label="Exit reason">
            <PillGroup options={EXIT_REASONS} value={trade.exit_reason} onChange={(v: string) => updTrade("exit_reason", v)} color={trade.exit_reason === "Stopped out" ? "red" : trade.exit_reason?.includes("TP") ? "green" : "blue"} />
          </Field>
          <Field label="Notes (optional)"><Textarea value={trade.notes} onChange={(v: string) => updTrade("notes", v)} placeholder="Anything worth remembering" rows={3} /></Field>
          {trade.pnl && (
            <Alert text={`${parseFloat(trade.pnl) >= 0 ? "Winner" : "Loser"} · $${Math.abs(parseFloat(trade.pnl)).toFixed(2)} · ${trade.exit_reason || "—"}`} color={parseFloat(trade.pnl) >= 0 ? "green" : "red"} />
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        {tradeStep > 0
          ? <Btn label="← Back" onClick={() => setTradeStep(s => s - 1)} variant="secondary" />
          : <Btn label="Cancel" onClick={() => setView("session")} variant="secondary" />}
        {tradeStep < TRADE_STEPS.length - 1
          ? <Btn label="Next →" onClick={() => setTradeStep(s => s + 1)} />
          : <Btn label={saving ? "Saving..." : "Save trade"} onClick={saveTrade} disabled={saving} variant="success" />}
      </div>
    </div>
  );

  return null;
}
