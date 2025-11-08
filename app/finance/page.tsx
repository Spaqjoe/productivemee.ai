"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CardButton } from "@/components/ui/card-button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { RxPlus } from "react-icons/rx";

type Txn = { id: string; kind: "income" | "expense"; amount: number; created_at?: string; note?: string };

const budgetFieldConfig = [
  { key: "income", label: "Income" },
  { key: "rent", label: "Rent" },
  { key: "bills", label: "Bills" },
  { key: "subscriptions", label: "Subscriptions" },
  { key: "food", label: "Food" },
  { key: "personal_expenses", label: "Personal Expenses" },
  { key: "investment", label: "Investment" },
  { key: "emergency_savings", label: "Emergency Savings" },
] as const;

type BudgetFieldKey = typeof budgetFieldConfig[number]["key"];
type BudgetFormState = Record<BudgetFieldKey, string>;

const createEmptyBudgetForm = (): BudgetFormState =>
  budgetFieldConfig.reduce((acc, field) => {
    acc[field.key] = "";
    return acc;
  }, {} as BudgetFormState);

export default function FinancePage() {
  const [txns, setTxns] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [budgetForm, setBudgetForm] = useState<BudgetFormState>(() => createEmptyBudgetForm());
  const [budgetSubmitting, setBudgetSubmitting] = useState(false);

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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Finance Tracker</h1>
          <p className="text-muted-foreground">Track your monthly income and expenses</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <CardButton
            type="button"
            onClick={() => setBudgetDialogOpen(true)}
            className="min-w-[160px]"
          >
            <RxPlus className="h-4 w-4" />
            <span>New Budget</span>
          </CardButton>
          <Button onClick={exportXml} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Export XML
          </Button>
        </div>
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

      <Dialog
        open={budgetDialogOpen}
        onOpenChange={(open) => {
          setBudgetDialogOpen(open);
          if (!open) setBudgetForm(createEmptyBudgetForm());
        }}
      >
        <DialogContent
          onClose={() => {
            setBudgetDialogOpen(false);
            setBudgetForm(createEmptyBudgetForm());
          }}
          className="rounded-3xl border border-white/10 bg-white/5 text-white shadow-[0_30px_80px_-40px_rgba(79,70,229,0.55)] backdrop-blur"
        >
          <DialogHeader>
            <DialogTitle>Create Budget</DialogTitle>
            <DialogDescription className="text-white/70">
              Allocate your income across categories to track spending goals.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                setBudgetSubmitting(true);
                // Create client only when needed (lazy initialization)
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                  alert("You must be signed in to create a budget.");
                  return;
                }
                const payload = budgetFieldConfig.reduce((acc, field) => {
                  acc[field.key] = parseFloat(budgetForm[field.key] || "0") || 0;
                  return acc;
                }, {} as Record<BudgetFieldKey, number>);
                const { error } = await supabase
                  .from("finance_budgets")
                  .insert({
                    user_id: user.id,
                    ...payload,
                  });
                if (error) throw error;
                alert("Budget saved successfully!");
                setBudgetDialogOpen(false);
                setBudgetForm(createEmptyBudgetForm());
              } catch (error) {
                console.error("Failed to save budget", error);
                alert("Could not save budget. Please try again.");
              } finally {
                setBudgetSubmitting(false);
              }
            }}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {budgetFieldConfig.map(({ key, label }) => (
                <div key={key} className="space-y-2">
                  <label className="block text-sm font-medium text-white/80">{label}</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={budgetForm[key]}
                    onChange={(event) =>
                      setBudgetForm((prev) => ({
                        ...prev,
                        [key]: event.target.value,
                      }))
                    }
                    placeholder="0.00"
                    className="border-white/20 bg-white/10 text-white placeholder:text-white/50 focus-visible:ring-primary"
                  />
                </div>
              ))}
            </div>
            <DialogFooter className="sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setBudgetDialogOpen(false);
                  setBudgetForm(createEmptyBudgetForm());
                }}
                className="text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={budgetSubmitting}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {budgetSubmitting ? "Saving..." : "Save Budget"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

