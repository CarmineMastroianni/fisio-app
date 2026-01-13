import { useEffect, useMemo, useState } from "react";
import type { Appointment, Deposit, PaymentMethodType } from "../../../types";
import {
  formatCurrency,
  getOutstandingAmount,
  getPaidAmount,
  getPaymentStatus,
  getTotalAmount,
} from "../../../lib/payments";
import { Button } from "../../../components/Button";
import { Badge } from "../../../components/Badge";

type PaymentPanelProps = {
  visit: Appointment;
  onAddDeposit: (deposit: Deposit) => void;
  onRemoveDeposit: (depositId: string) => void;
};

const methods: PaymentMethodType[] = ["contanti", "bonifico", "pos"];

export const PaymentPanel = ({ visit, onAddDeposit, onRemoveDeposit }: PaymentPanelProps) => {
  const [amount, setAmount] = useState<number>(() => Math.max(getOutstandingAmount(visit), 0));
  const [method, setMethod] = useState<PaymentMethodType>("contanti");
  const [paidAt, setPaidAt] = useState<string>(() => new Date().toISOString().slice(0, 16));
  const [note, setNote] = useState("");

  const paidAmount = useMemo(() => getPaidAmount(visit), [visit]);
  const outstanding = useMemo(() => getOutstandingAmount(visit), [visit]);
  const paymentStatus = useMemo(() => getPaymentStatus(visit), [visit]);

  useEffect(() => {
    setAmount(Math.max(getOutstandingAmount(visit), 0));
    if (visit.payment.method) setMethod(visit.payment.method);
  }, [visit]);

  const onSubmit = () => {
    if (!amount || amount <= 0) return;
    onAddDeposit({
      id: crypto.randomUUID(),
      visitId: visit.id,
      amount,
      method,
      paidAt: paidAt ? new Date(paidAt).toISOString() : new Date().toISOString(),
      note: note || undefined,
    });
    setAmount(Math.max(outstanding - amount, 0));
    setNote("");
  };

  const markPaid = () => {
    if (outstanding <= 0) return;
    onAddDeposit({
      id: crypto.randomUUID(),
      visitId: visit.id,
      amount: outstanding,
      method,
      paidAt: paidAt ? new Date(paidAt).toISOString() : new Date().toISOString(),
      note: note || "Saldo finale",
    });
    setAmount(0);
    setNote("");
  };

  const statusTone =
    paymentStatus === "paid" ? "success" : paymentStatus === "partial" ? "warning" : "danger";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Pagamento</p>
          <div className="mt-2 flex items-center gap-2">
            <Badge
              label={
                paymentStatus === "paid" ? "Pagata" : paymentStatus === "partial" ? "Parziale" : "Insoluta"
              }
              tone={statusTone}
            />
            <span className="text-xs text-slate-500">
              Totale {formatCurrency(getTotalAmount(visit))} · Pagato {formatCurrency(paidAmount)} · Residuo {formatCurrency(outstanding)}
            </span>
          </div>
        </div>
        {paymentStatus !== "paid" ? (
          <Button size="sm" variant="outline" onClick={markPaid}>
            Segna pagata
          </Button>
        ) : null}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold text-slate-600">Aggiungi acconto</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-xs font-semibold text-slate-500">
            Importo
            <input
              type="number"
              min={0}
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-semibold text-slate-500">
            Metodo
            <select
              value={method}
              onChange={(event) => setMethod(event.target.value as PaymentMethodType)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {methods.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-500">
            Data
            <input
              type="datetime-local"
              value={paidAt}
              onChange={(event) => setPaidAt(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-semibold text-slate-500">
            Nota (opzionale)
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
              placeholder="Acconto, saldo, dettaglio"
            />
          </label>
        </div>
        <div className="mt-3">
          <Button size="sm" onClick={onSubmit}>
            Registra acconto
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-600">Movimenti</p>
        {(visit.deposits ?? []).length === 0 ? (
          <p className="text-xs text-slate-400">Nessun acconto registrato.</p>
        ) : (
          <div className="space-y-2">
            {(visit.deposits ?? []).map((deposit) => (
              <div
                key={deposit.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs"
              >
                <div>
                  <p className="font-semibold text-slate-700">{formatCurrency(deposit.amount)}</p>
                  <p className="text-slate-500">
                    {new Date(deposit.paidAt).toLocaleString("it-IT", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}{" "}
                    · {deposit.method}
                  </p>
                  {deposit.note ? <p className="text-slate-400">{deposit.note}</p> : null}
                </div>
                <Button size="sm" variant="ghost" onClick={() => onRemoveDeposit(deposit.id)}>
                  Rimuovi
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
