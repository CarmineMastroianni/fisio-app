import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { useAuthStore } from "../stores/authStore";

const loginSchema = z.object({
  email: z.string().email("Inserisci un'email valida"),
  password: z.string().min(4, "Minimo 4 caratteri"),
});

type LoginForm = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (data: LoginForm) => {
    const ok = login(data.email, data.password);
    if (ok) navigate("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-sand-50 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-lg">
        <p className="text-xs uppercase tracking-[0.3em] text-teal-700">Fisioterapista a domicilio</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">Accedi alla tua agenda</h1>
        <p className="mt-2 text-sm text-slate-500">
          Gestisci visite, pazienti e incassi ovunque ti trovi.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="text-sm font-medium text-slate-600">Email</label>
            <input
              {...register("email")}
              type="email"
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-teal-500 focus:outline-none"
              placeholder="nome@email.it"
            />
            {errors.email ? <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p> : null}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">Password</label>
            <input
              {...register("password")}
              type="password"
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-teal-500 focus:outline-none"
              placeholder="••••"
            />
            {errors.password ? (
              <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>
            ) : null}
          </div>
          <Button type="submit" className="w-full">Accedi</Button>
        </form>
        <div className="mt-6 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
          Demo rapida: inserisci qualsiasi email e una password di almeno 4 caratteri.
        </div>
      </div>
    </div>
  );
};
