import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Toaster, toast } from "sonner";
import { Trash2, Plus, LogOut, Save, ArrowLeft } from "lucide-react";
import {
  ADMIN_EMAIL,
  adminLogin,
  adminLogout,
  isAdminAuthed,
  useSiteSettings,
  type MediaItem,
} from "@/lib/site-settings";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel Administrativo · Mais de 1 green" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [authed, setAuthed] = useState<boolean>(() => isAdminAuthed());
  if (!authed) return <LoginScreen onAuth={() => setAuthed(true)} />;
  return <AdminDashboard onLogout={() => { adminLogout(); setAuthed(false); }} />;
}

function LoginScreen({ onAuth }: { onAuth: () => void }) {
  const [email, setEmail] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminLogin(email)) {
      toast.success("Acesso concedido.");
      onAuth();
    } else {
      toast.error("E-mail não autorizado.");
    }
  };
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <Toaster theme="dark" position="top-center" />
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-elegant)]">
        <h1 className="text-lg font-bold">Painel Administrativo</h1>
        <p className="mt-1 text-xs text-muted-foreground">Acesso restrito ao administrador autorizado.</p>
        <label className="mt-4 block text-xs font-medium text-muted-foreground">E-mail do administrador</label>
        <input
          type="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={ADMIN_EMAIL}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          className="mt-4 w-full rounded-lg bg-gradient-to-r from-primary to-primary-glow px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Entrar
        </button>
        <Link to="/" className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-3 w-3" /> Voltar ao site
        </Link>
      </form>
    </div>
  );
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [settings, update] = useSiteSettings();
  const [draft, setDraft] = useState(settings);

  const save = () => {
    update(draft);
    toast.success("Configurações salvas no dispositivo (localStorage).");
  };

  const setField = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) =>
    setDraft({ ...draft, [key]: value });

  const addMedia = () => {
    const item: MediaItem = {
      id: crypto.randomUUID(),
      title: "Novo destaque",
      image: "",
      audio: "",
      redirect: "",
      placement: "footer",
    };
    setDraft({ ...draft, media: [...draft.media, item] });
  };

  const updateMedia = (id: string, patch: Partial<MediaItem>) =>
    setDraft({ ...draft, media: draft.media.map((m) => (m.id === id ? { ...m, ...patch } : m)) });

  const removeMedia = (id: string) =>
    setDraft({ ...draft, media: draft.media.filter((m) => m.id !== id) });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster theme="dark" position="top-center" />
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-bold">Painel · {draft.siteName}</h1>
            <p className="text-[11px] text-muted-foreground">Edições persistem localmente (localStorage).</p>
          </div>
          <div className="flex gap-2">
            <Link to="/" className="rounded-lg border border-border bg-card px-3 py-2 text-xs">Ver site</Link>
            <button onClick={save} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">
              <Save className="h-3.5 w-3.5" /> Guardar tudo
            </button>
            <button onClick={onLogout} className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-xs">
              <LogOut className="h-3.5 w-3.5" /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-bold">Identidade do site</h2>
          <div className="mt-3 grid gap-3">
            <Field label="Nome do site">
              <input value={draft.siteName} onChange={(e) => setField("siteName", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Texto do cabeçalho">
              <input value={draft.headerText} onChange={(e) => setField("headerText", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Texto do rodapé">
              <textarea value={draft.footerText} onChange={(e) => setField("footerText", e.target.value)} rows={3} className={inputCls} />
            </Field>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-bold">Cores do tema</h2>
          <div className="mt-3 grid gap-3">
            <ColorField label="Cor primária" value={draft.primaryColor} onChange={(v) => setField("primaryColor", v)} />
            <ColorField label="Cor de destaque" value={draft.accentColor} onChange={(v) => setField("accentColor", v)} />
            <ColorField label="Cor de fundo" value={draft.backgroundColor} onChange={(v) => setField("backgroundColor", v)} />
            <p className="text-[11px] text-muted-foreground">Pré-visualização aplica em tempo real ao salvar.</p>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 md:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">Mídia & banners ({draft.media.length})</h2>
            <button onClick={addMedia} className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <Plus className="h-3.5 w-3.5" /> Adicionar item
            </button>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Aceita URLs do PostImg, YouTube, TikTok, Facebook, Internet Archive, etc. Se preencher
            "URL de Redirecionamento", o banner abre numa nova janela.
          </p>
          <div className="mt-4 grid gap-4">
            {draft.media.length === 0 && (
              <div className="rounded-xl border border-dashed border-border bg-background/40 p-6 text-center text-xs text-muted-foreground">
                Sem itens. Clica em "Adicionar item" para criar o primeiro banner.
              </div>
            )}
            {draft.media.map((m) => (
              <div key={m.id} className="grid gap-3 rounded-xl border border-border bg-background/40 p-4 md:grid-cols-2">
                <Field label="Título">
                  <input value={m.title} onChange={(e) => updateMedia(m.id, { title: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Posição">
                  <select
                    value={m.placement}
                    onChange={(e) => updateMedia(m.id, { placement: e.target.value as MediaItem["placement"] })}
                    className={inputCls}
                  >
                    <option value="header">Cabeçalho</option>
                    <option value="footer">Rodapé</option>
                    <option value="both">Ambos</option>
                  </select>
                </Field>
                <Field label="URL da imagem / capa">
                  <input value={m.image} onChange={(e) => updateMedia(m.id, { image: e.target.value })} placeholder="https://i.postimg.cc/..." className={inputCls} />
                </Field>
                <Field label="URL de áudio (opcional)">
                  <input value={m.audio ?? ""} onChange={(e) => updateMedia(m.id, { audio: e.target.value })} placeholder="https://dn720707.ca.archive.org/...mp3" className={inputCls} />
                </Field>
                <Field label="URL de Redirecionamento (Link de Destino)">
                  <input
                    value={m.redirect ?? ""}
                    onChange={(e) => updateMedia(m.id, { redirect: e.target.value })}
                    placeholder="https://youtube.com/@... · https://tiktok.com/@... · https://wa.me/..."
                    className={inputCls}
                  />
                </Field>
                <div className="flex items-end justify-end">
                  <button
                    onClick={() => removeMedia(m.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2">
        <input
          type="color"
          value={toHex(value)}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-32 rounded-lg border border-border bg-background px-2 py-1 text-xs"
        />
      </span>
    </label>
  );
}

function toHex(v: string): string {
  if (v.startsWith("#")) return v;
  return "#22c55e";
}
