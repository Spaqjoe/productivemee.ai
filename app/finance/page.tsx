"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

type Txn = { id: string; kind: "income" | "expense"; amount: number; created_at?: string; note?: string };

export default function FinancePage() {
  const [txns, setTxns] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Create client only when needed (lazy initialization)
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setTxns([]); setLoading(false); return; }
        const { data } = await supabase
          .from("finance_txns")
          .select("id, kind, amount, created_at, note")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        setTxns((data as any) || []);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totals = useMemo(() => {
    const income = txns.filter(t => t.kind === "income").reduce((a, b) => a + (Number(b.amount) || 0), 0);
    const expenses = txns.filter(t => t.kind === "expense").reduce((a, b) => a + (Number(b.amount) || 0), 0);
    return { income, expenses, net: income - expenses };
  }, [txns]);

  const cashflowSeries = useMemo(() => {
    // Group by day last 14 days
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      const key = d.toISOString().split("T")[0];
      return { key, label: `${d.getMonth() + 1}/${d.getDate()}`, income: 0, expense: 0 };
    });
    const byKey = new Map(days.map(d => [d.key, d]));
    for (const t of txns) {
      const d = t.created_at ? new Date(t.created_at) : new Date();
      const key = d.toISOString().split("T")[0];
      const bucket = byKey.get(key);
      if (!bucket) continue;
      if (t.kind === "income") bucket.income += Number(t.amount) || 0;
      else bucket.expense += Number(t.amount) || 0;
    }
    return days;
  }, [txns]);

  const exportXml = () => {
    const xmlItems = txns.map(t => `    <txn id="${t.id}" kind="${t.kind}" amount="${t.amount}" date="${t.created_at || ""}"><note>${(t.note || "").replace(/&/g, "&amp;").replace(/</g, "&lt;")}</note></txn>`).join("\n");
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<financeExport>\n  <summary income="${totals.income}" expenses="${totals.expenses}" net="${totals.net}"/>\n  <transactions>\n${xmlItems}\n  </transactions>\n</financeExport>`;
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finance_export_${new Date().toISOString().split("T")[0]}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Finance Tracker</h1>
        <p className="text-muted-foreground">Track your monthly income and expenses</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">${totals.income.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">${totals.expenses.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totals.net.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cashflow (last 14 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflowSeries} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: any, k: any) => [Number(v).toFixed(2), k === 'income' ? 'Income' : 'Expenses']} />
                <Bar dataKey="income" stackId="cf" fill="#16a34a" />
                <Bar dataKey="expense" stackId="cf" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={exportXml} className="bg-primary text-primary-foreground hover:bg-primary/90">Export XML</Button>
      </div>
    </div>
  );
}

