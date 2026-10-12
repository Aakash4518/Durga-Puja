"use client";



import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";



type FinanceRecord = {

  _id: string; amountRupees: number; status: string; paymentStatus?: string;

  donorName?: string; receiptNumber?: string; paymentMethod?: string; receivedOn?: string;

  reference?: string; notes?: string; enteredBy?: string; createdAt?: string;

  vendorName?: string; category?: string; description?: string; expenseNumber?: string;

  incurredOn?: string; billReference?: string; paidOn?: string; paymentReference?: string; submittedBy?: string;

  voidReason?: string; rejectionReason?: string;

};

type Totals = { donationRupees: number; approvedExpenseRupees: number; paidExpenseRupees: number; unpaidApprovedRupees: number; cashPositionRupees: number; donationCount: number; expenseCount: number };

type Audit = { _id: string; action: string; recordType: string; recordNumber?: string; actor: string; reason?: string; createdAt: string };

const categories = ["decoration", "electricity", "sound", "tent", "prasad_food", "cleaning", "transport", "permissions", "other"];

const money = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n || 0);

const today = () => new Date().toISOString().slice(0, 10);

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {

  if (!rows.length) { window.dispatchEvent(new CustomEvent("finance-export-empty")); return; }

  const keys = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));

  const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

  const csv = [keys.map(cell).join(","), ...rows.map((r) => keys.map((k) => cell(r[k])).join(","))].join("\r\n");

  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });

  const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);

}



export default function FinanceDashboard() {

  const [donations, setDonations] = useState<FinanceRecord[]>([]);

  const [expenses, setExpenses] = useState<FinanceRecord[]>([]);

  const [audit, setAudit] = useState<Audit[]>([]);

  const [totals, setTotals] = useState<Totals | null>(null);

  const [search, setSearch] = useState("");

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  const [busy, setBusy] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState<{
    record: FinanceRecord;
    paidOn: string;
    paymentReference: string;
  } | null>(null);

  const [donorName, setDonorName] = useState(""); const [donationAmount, setDonationAmount] = useState(""); const [paymentMethod, setPaymentMethod] = useState("cash"); const [receivedOn, setReceivedOn] = useState(today()); const [reference, setReference] = useState(""); const [donationNotes, setDonationNotes] = useState("");

  const [vendorName, setVendorName] = useState(""); const [category, setCategory] = useState("decoration"); const [description, setDescription] = useState(""); const [expenseAmount, setExpenseAmount] = useState(""); const [incurredOn, setIncurredOn] = useState(today()); const [billReference, setBillReference] = useState(""); const [expenseNotes, setExpenseNotes] = useState("");



  const load = useCallback(async () => {

    setError("");

    try {

      const [d, e, s, a] = await Promise.all([

        fetch("/api/admin/finance/donations", { cache: "no-store" }), fetch("/api/admin/finance/expenses", { cache: "no-store" }),

        fetch("/api/admin/finance/summary", { cache: "no-store" }), fetch("/api/admin/finance/audit", { cache: "no-store" }),

      ]);

      const [dj, ej, sj, aj] = await Promise.all([d.json(), e.json(), s.json(), a.json()]);

      if (!d.ok || !e.ok || !s.ok || !a.ok) throw new Error(dj.error || ej.error || sj.error || aj.error || "Could not load finance records.");

      setDonations(dj.donations || []); setExpenses(ej.expenses || []); setTotals(sj.totals || null); setAudit(aj.logs || []);

    } catch (err) { setError(err instanceof Error ? err.message : "Could not load finance records."); }

  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const handleEmptyExport = () => setMessage("There are no records to export.");
    window.addEventListener("finance-export-empty", handleEmptyExport);
    return () => window.removeEventListener("finance-export-empty", handleEmptyExport);
  }, []);



  async function submitRecord(url: string, body: Record<string, unknown>, reset: () => void) {

    setBusy(true); setError(""); setMessage("");

    try {

      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Could not save record.");

      setMessage(result.message || "Saved successfully."); reset(); await load();

    } catch (err) { setError(err instanceof Error ? err.message : "Could not save record."); }

    finally { setBusy(false); }

  }

  async function expenseAction(record: FinanceRecord, action: "reject" | "void" | "mark_paid" | "mark_unpaid") {
    if (action === "mark_paid") {
      setPaymentDialog({ record, paidOn: today(), paymentReference: "" });
      return;
    }

    const promptText =
      action === "reject"
        ? "Why is this expense being rejected?"
        : action === "void"
          ? "Why is this expense being voided? The record will remain in the audit history."
          : "Why is the payment being changed back to unpaid?";
    const reason = window.prompt(promptText);
    if (!reason || reason.trim().length < 3) return;

    await performAction(`/api/admin/finance/expenses/${record._id}`, {
      action,
      reason: reason.trim(),
    });
  }

  async function voidDonation(record: FinanceRecord) {
    const reason = window.prompt(
      `Reason to void receipt ${record.receiptNumber || ""}. This does not delete it:`,
      "",
    );
    if (!reason || reason.trim().length < 3) return;

    await performAction(`/api/admin/finance/donations/${record._id}`, {
      reason: reason.trim(),
    });
  }

  async function performAction(url: string, body: Record<string, unknown>): Promise<boolean> {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Action failed.");
      setMessage(result.message || "Record updated.");
      await load();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function confirmMarkPaid(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!paymentDialog) return;
    const { record, paidOn, paymentReference } = paymentDialog;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(paidOn)) {
      setError("Enter the payment date in YYYY-MM-DD format.");
      return;
    }
    const saved = await performAction(`/api/admin/finance/expenses/${record._id}`, {
      action: "mark_paid",
      paidOn,
      paymentReference: paymentReference.trim(),
    });
    if (saved) setPaymentDialog(null);
  }

  // Normalize whitespace and case so searches work regardless of capitalization.
  const normalizedSearch = search.trim().toLocaleLowerCase("en-IN");

  const filteredDonations = useMemo(() => {
    if (!normalizedSearch) return donations;

    return donations.filter((record) =>
      [
        record.donorName,
        record.receiptNumber,
        record.paymentMethod,
        record.status,
        record.receivedOn,
        record.reference,
        record.notes,
        record.amountRupees,
        record.enteredBy,
        record.voidReason,
      ]
        .some((value) => String(value ?? "").toLocaleLowerCase("en-IN").includes(normalizedSearch)),
    );
  }, [donations, normalizedSearch]);

  const filteredExpenses = useMemo(() => {
    if (!normalizedSearch) return expenses;

    return expenses.filter((record) =>
      [
        record.vendorName,
        record.expenseNumber,
        record.category,
        record.description,
        record.status,
        record.paymentStatus,
        record.incurredOn,
        record.billReference,
        record.paidOn,
        record.paymentReference,
        record.notes,
        record.amountRupees,
        record.voidReason,
        record.rejectionReason,
        record.submittedBy,
      ]
        .some((value) => String(value ?? "").toLocaleLowerCase("en-IN").includes(normalizedSearch)),
    );
  }, [expenses, normalizedSearch]);

  const statusLabel = (r: FinanceRecord) => r.status === "voided" ? "Voided" : r.status === "rejected" ? "Rejected" : r.status === "approved" ? `Approved · ${r.paymentStatus === "paid" ? "Paid" : "Unpaid"}` : r.status === "received" ? "Received" : r.status === "pending_approval" ? "Pending approval" : r.status;



  return <div className="mt-8 space-y-8">

    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold tracking-[.2em] text-[#A36A2B]">COMMITTEE ACCOUNTS</p><h1 className="mt-2 text-3xl font-black text-[#571E24]">Finance management</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#80675E]">Admin-entered expenses are automatically approved. Mark an expense paid only after payment is made. Void records instead of permanently deleting financial history.</p></div><button onClick={() => void load()} className="rounded-xl border border-[#EAD9BD] bg-white px-4 py-3 text-sm font-bold">Refresh records</button></header>

    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}{message && <div role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">{message}</div>}

    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[

      ["Donations received", totals ? money(totals.donationRupees) : "Loading…", `${totals?.donationCount ?? 0} active donation records`],

      ["Approved expenses", totals ? money(totals.approvedExpenseRupees) : "Loading…", "Includes paid and unpaid approved expenses"],

      ["Expenses paid", totals ? money(totals.paidExpenseRupees) : "Loading…", "Only records marked paid"],

      ["Approved, unpaid", totals ? money(totals.unpaidApprovedRupees) : "Loading…", "Still owed / awaiting payment"],

      ["Estimated cash position", totals ? money(totals.cashPositionRupees) : "Loading…", "Donations received minus expenses marked paid"],

      ["Expense records", String(totals?.expenseCount ?? 0), "Excludes rejected and voided records"],

    ].map(([title, value, hint]) => <article key={title} className="rounded-2xl border border-[#EAD9BD] bg-white p-5"><p className="text-sm font-semibold text-[#80675E]">{title}</p><p className="mt-2 text-2xl font-black text-[#571E24]">{value}</p><p className="mt-2 text-xs leading-5 text-[#80675E]">{hint}</p></article>)}</section>



    <section className="grid gap-6 lg:grid-cols-2"><form onSubmit={(ev) => { ev.preventDefault(); void submitRecord("/api/admin/finance/donations", { donorName, amountRupees: Number(donationAmount), paymentMethod, receivedOn, reference, notes: donationNotes }, () => { setDonorName(""); setDonationAmount(""); setReference(""); setDonationNotes(""); }); }} className="space-y-4 rounded-2xl border border-[#EAD9BD] bg-white p-5 sm:p-6"><div><h2 className="text-xl font-black text-[#571E24]">Record donation / chanda</h2><p className="mt-1 text-sm text-[#80675E]">Use the actual received date and keep the UPI / bank reference where available.</p></div><label className="block text-sm font-semibold">Donor name<input required maxLength={120} value={donorName} onChange={(e) => setDonorName(e.target.value)} className="mt-1 w-full rounded-xl border border-[#EAD9BD] px-3 py-3 font-normal" placeholder="Donor or family name" /></label><div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm font-semibold">Amount (₹)<input required type="number" min="0.01" max="10000000" step="0.01" value={donationAmount} onChange={(e) => setDonationAmount(e.target.value)} className="mt-1 w-full rounded-xl border border-[#EAD9BD] px-3 py-3 font-normal" /></label><label className="block text-sm font-semibold">Received on<input required type="date" value={receivedOn} onChange={(e) => setReceivedOn(e.target.value)} className="mt-1 w-full rounded-xl border border-[#EAD9BD] px-3 py-3 font-normal" /></label></div><div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm font-semibold">Payment mode<select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="mt-1 w-full rounded-xl border border-[#EAD9BD] px-3 py-3 font-normal"><option value="cash">Cash</option><option value="upi">UPI</option><option value="bank_transfer">Bank transfer</option><option value="cheque">Cheque</option><option value="other">Other</option></select></label><label className="block text-sm font-semibold">UPI / bank reference<input value={reference} onChange={(e) => setReference(e.target.value)} maxLength={120} className="mt-1 w-full rounded-xl border border-[#EAD9BD] px-3 py-3 font-normal" /></label></div><label className="block text-sm font-semibold">Notes (optional)<textarea value={donationNotes} onChange={(e) => setDonationNotes(e.target.value)} maxLength={500} rows={2} className="mt-1 w-full rounded-xl border border-[#EAD9BD] px-3 py-3 font-normal" /></label><button disabled={busy} className="w-full rounded-xl bg-[#741925] px-4 py-3 font-bold text-white disabled:opacity-50">{busy ? "Saving…" : "Save donation and generate receipt number"}</button></form>



    <form onSubmit={(ev) => { ev.preventDefault(); void submitRecord("/api/admin/finance/expenses", { vendorName, category, description, amountRupees: Number(expenseAmount), incurredOn, billReference, notes: expenseNotes }, () => { setVendorName(""); setDescription(""); setExpenseAmount(""); setBillReference(""); setExpenseNotes(""); }); }} className="space-y-4 rounded-2xl border border-[#EAD9BD] bg-white p-5 sm:p-6"><div><h2 className="text-xl font-black text-[#571E24]">Record expense</h2><p className="mt-1 text-sm text-[#80675E]">Saving approves it as an admin entry; it starts as unpaid.</p></div><label className="block text-sm font-semibold">Vendor / paid to<input required maxLength={120} value={vendorName} onChange={(e) => setVendorName(e.target.value)} className="mt-1 w-full rounded-xl border border-[#EAD9BD] px-3 py-3 font-normal" placeholder="Shop, tent supplier, electrician…" /></label><div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm font-semibold">Category<select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full rounded-xl border border-[#EAD9BD] px-3 py-3 font-normal">{categories.map((c) => <option key={c} value={c}>{c.replaceAll("_", " ")}</option>)}</select></label><label className="block text-sm font-semibold">Amount (₹)<input required type="number" min="0.01" max="10000000" step="0.01" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} className="mt-1 w-full rounded-xl border border-[#EAD9BD] px-3 py-3 font-normal" /></label></div><label className="block text-sm font-semibold">Description<input required maxLength={300} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full rounded-xl border border-[#EAD9BD] px-3 py-3 font-normal" placeholder="What was purchased or arranged?" /></label><div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm font-semibold">Expense date<input required type="date" value={incurredOn} onChange={(e) => setIncurredOn(e.target.value)} className="mt-1 w-full rounded-xl border border-[#EAD9BD] px-3 py-3 font-normal" /></label><label className="block text-sm font-semibold">Bill / voucher number<input value={billReference} onChange={(e) => setBillReference(e.target.value)} maxLength={120} className="mt-1 w-full rounded-xl border border-[#EAD9BD] px-3 py-3 font-normal" /></label></div><label className="block text-sm font-semibold">Notes (optional)<textarea value={expenseNotes} onChange={(e) => setExpenseNotes(e.target.value)} maxLength={500} rows={2} className="mt-1 w-full rounded-xl border border-[#EAD9BD] px-3 py-3 font-normal" /></label><button disabled={busy} className="w-full rounded-xl bg-[#741925] px-4 py-3 font-bold text-white disabled:opacity-50">{busy ? "Saving…" : "Save and approve expense"}</button></form></section>



    <section className="rounded-2xl border border-[#EAD9BD] bg-white p-4 sm:p-5">
      <label htmlFor="finance-register-search" className="block text-sm font-bold text-[#571E24]">
        Search donation and expense registers
      </label>
      <input
        id="finance-register-search"
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Type a donor name, receipt number, vendor, expense number, UPI reference…"
        autoComplete="off"
        className="mt-2 w-full rounded-xl border border-[#EAD9BD] bg-white px-3 py-3 font-normal outline-none focus:border-[#741925] focus:ring-2 focus:ring-[#741925]/20"
      />
      <div className="mt-2 flex flex-col gap-1 text-xs text-[#80675E] sm:flex-row sm:items-center sm:justify-between">
        <p aria-live="polite">
          Showing {filteredDonations.length} of {donations.length} donations and {filteredExpenses.length} of {expenses.length} expenses.
        </p>
        {search && (
          <button type="button" onClick={() => setSearch("")} className="self-start font-bold text-[#741925] underline sm:self-auto">
            Clear search
          </button>
        )}
      </div>
      <p className="mt-2 text-xs leading-5 text-[#80675E]">Results update as you type. CSV exports use the currently filtered rows.</p>
    </section>

    <section id="donation-register" className="scroll-mt-6 rounded-2xl border border-[#EAD9BD] bg-white p-5 sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-black text-[#571E24]">Donation register</h2><p className="mt-1 text-sm text-[#80675E]">Voiding preserves the record and excludes it from the active donation total.</p></div><button onClick={() => downloadCsv("mela-donations.csv", filteredDonations.map((r) => ({ receiptNumber: r.receiptNumber, donorName: r.donorName, amountRupees: r.amountRupees, paymentMethod: r.paymentMethod, receivedOn: r.receivedOn, reference: r.reference, status: r.status, enteredBy: r.enteredBy, notes: r.notes })))} className="rounded-xl border border-[#EAD9BD] px-4 py-2 text-sm font-bold">Export donations CSV</button></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead><tr className="border-b border-[#EAD9BD] text-[#80675E]"><th className="p-3">Receipt / donor</th><th className="p-3">Date / mode</th><th className="p-3">Amount</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead><tbody>{filteredDonations.map((r) => <tr key={r._id} className="border-b border-[#F2E7D5]"><td className="p-3"><strong>{r.receiptNumber}</strong><br />{r.donorName}<br /><span className="text-xs text-[#80675E]">{r.reference || "No payment reference"}</span></td><td className="p-3">{r.receivedOn}<br /><span className="capitalize">{r.paymentMethod?.replaceAll("_", " ")}</span></td><td className="p-3 font-bold">{money(r.amountRupees)}</td><td className="p-3"><span className={r.status === "voided" ? "font-bold text-red-700" : "font-bold text-green-800"}>{statusLabel(r)}</span>{r.voidReason && <p className="mt-1 max-w-48 text-xs text-[#80675E]">Reason: {r.voidReason}</p>}</td><td className="p-3">{r.status !== "voided" ? <button disabled={busy} onClick={() => void voidDonation(r)} className="rounded-lg border border-red-200 px-3 py-2 font-semibold text-red-700">Void receipt</button> : "—"}</td></tr>)}{!filteredDonations.length && <tr><td colSpan={5} className="p-6 text-center text-[#80675E]">No donations match the search.</td></tr>}</tbody></table></div></section>



    <section id="expense-register" className="scroll-mt-6 rounded-2xl border border-[#EAD9BD] bg-white p-5 sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-black text-[#571E24]">Expense register</h2><p className="mt-1 text-sm text-[#80675E]">Reject, mark paid, or void with a reason. Nothing is permanently deleted.</p></div><button onClick={() => downloadCsv("mela-expenses.csv", filteredExpenses.map((r) => ({ expenseNumber: r.expenseNumber, vendorName: r.vendorName, category: r.category, description: r.description, amountRupees: r.amountRupees, incurredOn: r.incurredOn, billReference: r.billReference, status: r.status, paymentStatus: r.paymentStatus, paidOn: r.paidOn, paymentReference: r.paymentReference, submittedBy: r.submittedBy, voidReason: r.voidReason, rejectionReason: r.rejectionReason, notes: r.notes })))} className="rounded-xl border border-[#EAD9BD] px-4 py-2 text-sm font-bold">Export expenses CSV</button></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[1100px] text-left text-sm"><thead><tr className="border-b border-[#EAD9BD] text-[#80675E]"><th className="p-3">Expense / vendor</th><th className="p-3">Date / category</th><th className="p-3">Amount</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead><tbody>{filteredExpenses.map((r) => <tr key={r._id} className="border-b border-[#F2E7D5] align-top"><td className="p-3"><strong>{r.expenseNumber}</strong><br />{r.vendorName}<br /><span className="text-xs text-[#80675E]">{r.description}</span>{r.billReference && <p className="text-xs text-[#80675E]">Bill: {r.billReference}</p>}</td><td className="p-3">{r.incurredOn}<br /><span className="capitalize">{r.category?.replaceAll("_", " ")}</span></td><td className="p-3 font-bold">{money(r.amountRupees)}</td><td className="p-3"><strong className={r.status === "voided" || r.status === "rejected" ? "text-red-700" : "text-green-800"}>{statusLabel(r)}</strong>{(r.voidReason || r.rejectionReason) && <p className="mt-1 max-w-48 text-xs text-[#80675E]">Reason: {r.voidReason || r.rejectionReason}</p>}</td><td className="p-3"><div className="flex max-w-64 flex-wrap gap-2">{r.status === "approved" && r.paymentStatus !== "paid" && <button disabled={busy} onClick={() => void expenseAction(r, "mark_paid")} className="rounded-lg bg-green-700 px-3 py-2 font-semibold text-white">Mark paid</button>}{r.status === "approved" && r.paymentStatus === "paid" && <button disabled={busy} onClick={() => void expenseAction(r, "mark_unpaid")} className="rounded-lg border border-amber-300 px-3 py-2 font-semibold text-amber-800">Undo paid</button>}{r.status === "approved" && r.paymentStatus !== "paid" && <button disabled={busy} onClick={() => void expenseAction(r, "reject")} className="rounded-lg border border-red-200 px-3 py-2 font-semibold text-red-700">Reject</button>}{r.status !== "voided" && <button disabled={busy} onClick={() => void expenseAction(r, "void")} className="rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-700">Void</button>}</div></td></tr>)}{!filteredExpenses.length && <tr><td colSpan={5} className="p-6 text-center text-[#80675E]">No expenses match the search.</td></tr>}</tbody></table></div></section>



    <section className="rounded-2xl border border-[#EAD9BD] bg-white p-5 sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-black text-[#571E24]">Audit history</h2><p className="mt-1 text-sm text-[#80675E]">Recent actions, who performed them, and recorded reasons.</p></div><button onClick={() => downloadCsv("mela-finance-audit.csv", audit.map((r) => ({ action: r.action, recordType: r.recordType, recordNumber: r.recordNumber, actor: r.actor, reason: r.reason, createdAt: r.createdAt })))} className="rounded-xl border border-[#EAD9BD] px-4 py-2 text-sm font-bold">Export audit CSV</button></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead><tr className="border-b border-[#EAD9BD] text-[#80675E]"><th className="p-3">Date / time</th><th className="p-3">Action</th><th className="p-3">Record</th><th className="p-3">Admin</th><th className="p-3">Reason</th></tr></thead><tbody>{audit.map((r) => <tr key={r._id} className="border-b border-[#F2E7D5]"><td className="p-3">{r.createdAt ? new Date(r.createdAt).toLocaleString("en-IN") : "—"}</td><td className="p-3">{r.action}</td><td className="p-3">{r.recordType} · {r.recordNumber || r._id}</td><td className="p-3">{r.actor}</td><td className="p-3">{r.reason || "—"}</td></tr>)}{!audit.length && <tr><td colSpan={5} className="p-6 text-center text-[#80675E]">No audit actions yet.</td></tr>}</tbody></table></div></section>

      {paymentDialog && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy) setPaymentDialog(null);
          }}
        >
          <form
            onSubmit={(event) => void confirmMarkPaid(event)}
            className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-2xl sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mark-paid-title"
          >
            <h2 id="mark-paid-title" className="text-xl font-black text-[#571E24]">
              Confirm expense payment
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#80675E]">
              Mark <strong>{paymentDialog.record.expenseNumber || "this expense"}</strong> for{" "}
              <strong>{money(paymentDialog.record.amountRupees)}</strong> as paid only after the
              payment has actually been made.
            </p>
            <label className="mt-5 block text-sm font-semibold">
              Actual payment date
              <input required type="date" value={paymentDialog.paidOn}
                onChange={(event) => setPaymentDialog({ ...paymentDialog, paidOn: event.target.value })}
                className="mt-1 w-full rounded-xl border border-[#EAD9BD] px-3 py-3 font-normal" />
            </label>
            <label className="mt-4 block text-sm font-semibold">
              Payment reference / UPI UTR (optional)
              <input value={paymentDialog.paymentReference}
                onChange={(event) => setPaymentDialog({ ...paymentDialog, paymentReference: event.target.value })}
                maxLength={120} className="mt-1 w-full rounded-xl border border-[#EAD9BD] px-3 py-3 font-normal"
                placeholder="UPI UTR, bank reference, or voucher number" />
            </label>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" disabled={busy} onClick={() => setPaymentDialog(null)}
                className="rounded-xl border border-[#EAD9BD] px-4 py-3 font-bold text-[#571E24] disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={busy}
                className="rounded-xl bg-green-700 px-4 py-3 font-bold text-white disabled:opacity-50">
                {busy ? "Saving…" : "Confirm payment"}
              </button>
            </div>
          </form>
        </div>
      )}
  </div>;

}
