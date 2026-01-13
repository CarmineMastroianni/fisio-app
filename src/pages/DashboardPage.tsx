import { addDays, format, isWithinInterval, parseISO, startOfMonth } from "date-fns";
import { Link } from "react-router-dom";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { useAppointments, usePatients } from "../hooks/useData";
import { getOutstandingAmount, getPaidAmount, getPaymentStatus } from "../lib/payments";
import { formatCurrency, formatDateTime, isInCurrentWeek, isToday } from "../lib/utils";

export const DashboardPage = () => {
  const { data: appointments = [] } = useAppointments();
  const { data: patients = [] } = usePatients();

  const todayVisits = appointments.filter((apt) => isToday(apt.start));
  const weekVisits = appointments.filter((apt) => isInCurrentWeek(apt.start));

  const monthStart = startOfMonth(new Date());
  const monthRevenue = appointments
    .filter((apt) => getPaymentStatus(apt) === "paid" && parseISO(apt.start) >= monthStart)
    .reduce((sum, apt) => sum + getPaidAmount(apt), 0);

  const unpaid = appointments
    .filter((apt) => getPaymentStatus(apt) !== "paid")
    .reduce((sum, apt) => sum + getOutstandingAmount(apt), 0);

  const nextAppointments = appointments
    .filter((apt) => parseISO(apt.start) >= new Date())
    .sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime())
    .slice(0, 5)
    .map((apt) => ({
      ...apt,
      patient: patients.find((p) => p.id === apt.patientId),
    }));

  const weeklyRevenue = Array.from({ length: 7 }).map((_, index) => {
    const day = addDays(new Date(), index - 6);
    const dayTotal = appointments
      .filter((apt) => getPaymentStatus(apt) === "paid" && isWithinInterval(parseISO(apt.start), { start: day, end: addDays(day, 1) }))
      .reduce((sum, apt) => sum + getPaidAmount(apt), 0);
    return { day: format(day, "EEE"), value: dayTotal };
  });

  const visitsByTreatment = Object.entries(
    appointments.reduce<Record<string, number>>((acc, apt) => {
      acc[apt.trattamento] = (acc[apt.trattamento] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const paidData = [
    { name: "Pagate", value: appointments.filter((apt) => getPaymentStatus(apt) === "paid").length, color: "#0f766e" },
    { name: "Non pagate", value: appointments.filter((apt) => getPaymentStatus(apt) !== "paid").length, color: "#f97316" },
  ];

  return (
    <div className="space-y-6 pb-24 lg:pb-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Dashboard giornaliera</h2>
          <p className="text-sm text-slate-500">Vista rapida sull'andamento delle visite domiciliari.</p>
        </div>
        <Link to="/calendar">
          <Button>+ Nuova visita</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Visite oggi</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{todayVisits.length}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Visite settimana</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{weekVisits.length}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Incassi mese</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{formatCurrency(monthRevenue)}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Insoluti</p>
          <p className="mt-3 text-2xl font-semibold text-rose-600">{formatCurrency(unpaid)}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Pazienti attivi</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{patients.length}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Incassi settimanali</h3>
            <span className="text-xs text-slate-500">ultimi 7 giorni</span>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyRevenue}>
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#0f766e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="grid gap-6">
          <Card>
            <h3 className="text-sm font-semibold text-slate-800">Visite per trattamento</h3>
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={visitsByTreatment} dataKey="value" nameKey="name" innerRadius={50} outerRadius={70}>
                    {visitsByTreatment.map((entry, index) => (
                      <Cell key={entry.name} fill={["#0f766e", "#f97316", "#38bdf8", "#8b5cf6"][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card>
            <h3 className="text-sm font-semibold text-slate-800">Pagate vs non pagate</h3>
            <div className="mt-4 flex items-center gap-4">
              <div className="h-28 w-28">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paidData} dataKey="value" nameKey="name" outerRadius={50}>
                      {paidData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 text-xs text-slate-600">
                {paidData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}: {item.value}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Prossimi appuntamenti</h3>
          <Link to="/calendar" className="text-xs font-semibold text-teal-600">
            Apri calendario
          </Link>
        </div>
        <div className="mt-4 divide-y divide-slate-100">
          {nextAppointments.map((apt) => (
            <div key={apt.id} className="flex flex-col gap-1 py-3 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-800">
                  {apt.patient?.nome} {apt.patient?.cognome}
                </p>
                <span className="text-xs text-slate-500">{formatDateTime(apt.start)}</span>
              </div>
              <p className="text-xs text-slate-500">{apt.trattamento} · {apt.luogo}</p>
            </div>
          ))}
          {nextAppointments.length === 0 ? (
            <p className="py-4 text-sm text-slate-500">Nessun appuntamento in agenda.</p>
          ) : null}
        </div>
      </Card>
    </div>
  );
};
