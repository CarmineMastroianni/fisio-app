import { useEffect, useState } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Field } from "../components/Field";
import { useSettings, useSettingsMutation } from "../hooks/useData";
import { useAuthStore } from "../stores/authStore";
import type { PaymentMethod, Treatment } from "../types";

export const SettingsPage = () => {
  const { data: settings } = useSettings();
  const { mutate } = useSettingsMutation();
  const { loginWithGoogle, providerToken } = useAuthStore();

  const [treatmentName, setTreatmentName] = useState("");
  const [treatmentDuration, setTreatmentDuration] = useState(45);
  const [treatmentCost, setTreatmentCost] = useState(70);
  const [paymentName, setPaymentName] = useState("");
  const [standardRate, setStandardRate] = useState(70);

  if (!settings) return null;

  useEffect(() => {
    setStandardRate(settings.tariffaStandard);
  }, [settings.tariffaStandard]);

  const saveSettings = (partial: Partial<typeof settings>) => {
    mutate({ ...settings, ...partial });
  };

  const addTreatment = () => {
    if (!treatmentName) return;
    const newTreatment: Treatment = {
      id: crypto.randomUUID(),
      nome: treatmentName,
      durata: treatmentDuration,
      costoDefault: treatmentCost,
    };
    saveSettings({ trattamenti: [...settings.trattamenti, newTreatment] });
    setTreatmentName("");
  };

  const addPaymentMethod = () => {
    if (!paymentName) return;
    const newMethod: PaymentMethod = { id: crypto.randomUUID(), nome: paymentName };
    saveSettings({ metodiPagamento: [...settings.metodiPagamento, newMethod] });
    setPaymentName("");
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Settings</h2>
        <p className="text-sm text-slate-500">Personalizza trattamenti, metodi di pagamento e tariffe.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <h3 className="text-sm font-semibold text-slate-800">Trattamenti</h3>
          <div className="mt-4 space-y-3">
            {settings.trattamenti.map((treatment) => (
              <div key={treatment.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-slate-800">{treatment.nome}</p>
                  <p className="text-xs text-slate-500">{treatment.durata} min · {treatment.costoDefault}€</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Field label="Nome">
              <input
                value={treatmentName}
                onChange={(event) => setTreatmentName(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Durata (min)">
              <input
                type="number"
                value={treatmentDuration}
                onChange={(event) => setTreatmentDuration(Number(event.target.value))}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Costo default">
              <input
                type="number"
                value={treatmentCost}
                onChange={(event) => setTreatmentCost(Number(event.target.value))}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
              />
            </Field>
          </div>
          <Button className="mt-3" onClick={addTreatment}>
            Aggiungi trattamento
          </Button>
        </Card>

        <div className="space-y-6">
          <Card>
            <h3 className="text-sm font-semibold text-slate-800">Metodi di pagamento</h3>
            <div className="mt-4 space-y-2">
              {settings.metodiPagamento.map((method) => (
                <div key={method.id} className="rounded-2xl bg-slate-50 px-4 py-2 text-sm">
                  {method.nome}
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <input
                value={paymentName}
                onChange={(event) => setPaymentName(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Nuovo metodo"
              />
              <Button onClick={addPaymentMethod}>Aggiungi</Button>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-slate-800">Tariffa standard</h3>
            <div className="mt-4">
              <input
                type="number"
                value={standardRate}
                onChange={(event) => setStandardRate(Number(event.target.value))}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
              />
              <Button className="mt-3" onClick={() => saveSettings({ tariffaStandard: standardRate })}>
                Salva tariffa
              </Button>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-slate-800">Google Calendar</h3>
            <p className="mt-1 text-xs text-slate-500">
              Sincronizza le visite con il tuo Google Calendar personale.
            </p>
            <div className="mt-4 space-y-3">
              {!providerToken ? (
                <div>
                  <p className="mb-3 text-xs text-amber-600">
                    Per abilitare la sincronizzazione devi accedere con il tuo account Google.
                  </p>
                  <button
                    type="button"
                    onClick={() => void loginWithGoogle()}
                    className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Collega account Google
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center gap-3">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={settings.googleCalendarEnabled}
                      onChange={(e) => saveSettings({ googleCalendarEnabled: e.target.checked })}
                    />
                    <div className={`h-6 w-11 rounded-full transition ${settings.googleCalendarEnabled ? "bg-teal-500" : "bg-slate-200"}`} />
                    <div className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${settings.googleCalendarEnabled ? "translate-x-5" : ""}`} />
                  </div>
                  <span className="text-sm text-slate-700">
                    {settings.googleCalendarEnabled ? "Sincronizzazione attiva" : "Sincronizzazione disattivata"}
                  </span>
                </label>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
