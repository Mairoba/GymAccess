
import { useState } from "react";
import {
  Dumbbell,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { supabase } from "../lib/supabase";

async function ensureOwnerProfile(user) {
  // A returning owner may already have a profile.
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("id, gym_id, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw profileError;
  if (profile) return profile;

  // For a first-time owner, recover details from signup metadata.
  const metadata = user.user_metadata ?? {};
  const fullName = metadata.full_name?.trim();
  const gymName = metadata.gym_name?.trim();

  if (!fullName || !gymName) {
    throw new Error(
      "No gym profile is linked to this account. Please register a gym account."
    );
  }

  // Reuse a gym if a previous attempt created it but did not finish.
  const { data: existingGyms, error: gymLookupError } = await supabase
    .from("gyms")
    .select("id")
    .eq("owner_user_id", user.id)
    .limit(1);

  if (gymLookupError) throw gymLookupError;

  let gym = existingGyms?.[0];

  if (!gym) {
    const { data: newGym, error: gymInsertError } = await supabase
      .from("gyms")
      .insert({
        owner_user_id: user.id,
        name: gymName,
        email: user.email,
        phone: metadata.phone || null,
      })
      .select("id")
      .single();

    if (gymInsertError) throw gymInsertError;
    gym = newGym;
  }

  const { data: newProfile, error: profileInsertError } = await supabase
    .from("user_profiles")
    .insert({
      id: user.id,
      gym_id: gym.id,
      full_name: fullName,
      role: "owner",
    })
    .select("id, gym_id, full_name, role")
    .single();

  if (profileInsertError) throw profileInsertError;
  return newProfile;
}

export default function Auth({ onAuthenticated }) {
  const [mode, setMode] = useState("register");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    gymName: "",
    email: "",
    phone: "",
    password: "",
  });

  const isRegister = mode === "register";

  function updateField(event) {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      let user;
      let session;

      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            data: {
              full_name: form.fullName.trim(),
              gym_name: form.gymName.trim(),
              phone: form.phone.trim(),
            },
          },
        });

        if (error) throw error;

        user = data.user;
        session = data.session;

        if (!session) {
          setMode("login");
          setSuccessMessage(
            "Your account has been created. Check your email to confirm your address, then sign in to finish setting up your gym."
          );
          return;
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });

        if (error) throw error;

        user = data.user;
        session = data.session;
      }

      await ensureOwnerProfile(user);
      setSuccessMessage("Signed in successfully.");

      if (session) {
        onAuthenticated?.(session);
      }
    } catch (error) {
      setErrorMessage(
        error.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="flex flex-col justify-between bg-slate-900 p-8 sm:p-12 lg:p-16">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400 text-slate-950">
              <Dumbbell size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">GymAccess</h1>
              <p className="text-xs text-slate-400">
                Membership management made simple
              </p>
            </div>
          </div>

          <div className="my-14 max-w-lg">
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-sm text-emerald-300">
              Your gym, organised
            </span>
            <h2 className="mt-7 text-4xl font-bold leading-tight sm:text-5xl">
              Spend less time managing memberships.
              <span className="text-emerald-400"> Focus on fitness.</span>
            </h2>
            <p className="mt-6 max-w-md leading-7 text-slate-400">
              Manage members, track payments, check membership expiry, and
              record gym attendance from one simple workspace.
            </p>

            <div className="mt-10 space-y-4 text-sm text-slate-300">
              {[
                "Member records and membership plans",
                "Payment confirmation and receipts",
                "Digital membership cards and QR check-ins",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <ShieldCheck
                    size={19}
                    className="shrink-0 text-emerald-400"
                  />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-500">
            GymAccess · Built for gyms of every size
          </p>
        </section>

        <section className="flex items-center justify-center p-6 py-12 sm:p-12">
          <div className="w-full max-w-md">
            <p className="text-sm font-medium text-emerald-400">
              OWNER PORTAL
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              {isRegister ? "Register your gym" : "Welcome back"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {isRegister
                ? "Create your owner account to get started with GymAccess."
                : "Sign in to manage your gym and its memberships."}
            </p>

            <div className="mt-8 grid grid-cols-2 rounded-xl bg-slate-900 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                  isRegister
                    ? "bg-emerald-400 text-slate-950"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Create account
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                  !isRegister
                    ? "bg-emerald-400 text-slate-950"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Sign in
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {isRegister && (
                <>
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Owner's full name
                    </label>
                    <input
                      name="fullName"
                      value={form.fullName}
                      onChange={updateField}
                      required
                      minLength={2}
                      autoComplete="name"
                      placeholder="Enter your full name"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Gym or business name
                    </label>
                    <input
                      name="gymName"
                      value={form.gymName}
                      onChange={updateField}
                      required
                      minLength={2}
                      autoComplete="organization"
                      placeholder="e.g. Prime Fitness Centre"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Phone number <span className="text-slate-500">(optional)</span>
                    </label>
                    <input
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={updateField}
                      autoComplete="tel"
                      placeholder="e.g. 08012345678"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Email address
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={updateField}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={updateField}
                    required
                    minLength={6}
                    autoComplete={
                      isRegister ? "new-password" : "current-password"
                    }
                    placeholder={
                      isRegister
                        ? "At least 6 characters"
                        : "Enter your password"
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 pr-12 text-sm outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <p
                  role="alert"
                  className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
                >
                  {errorMessage}
                </p>
              )}

              {successMessage && (
                <p
                  role="status"
                  className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300"
                >
                  {successMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3.5 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Please wait..."
                  : isRegister
                    ? "Create gym account"
                    : "Sign in to GymAccess"}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            <p className="mt-6 text-center text-xs leading-5 text-slate-500">
              Your gym's records are protected by account-based access
              policies. Only authorised staff should use your account.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
