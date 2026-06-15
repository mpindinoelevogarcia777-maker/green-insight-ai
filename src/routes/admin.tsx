import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { analyzeMatch } from "../lib/analyze.functions";

export const Route = createFileRoute('/admin')({
  component: AdminPage,
});

function AdminPage() {
  const [pesquisa, setPesquisa] = useState("");
  const [analiseResultado, setAnaliseResultado] = useState("");
  const [carregando, setCarregando] = useState(false);

  const buscarPalpiteIA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pesquisa.trim()) {
      toast.error("Por favor, digite o nome de um jogo ou times!");
      return;
    }

    setCarregando(true);
    setAnaliseResultado("");
    toast.info("A Inteligência Artificial está buscando dados na internet e analisando o jogo...");

    try {
      const resultado = await analyzeMatch(pesquisa);
      if (resultado && resultado.ai_analysis) {
        setAnaliseResultado(resultado.ai_analysis);
        toast.success("Palpite forte gerado com sucesso!");
      } else {
        setAnaliseResultado("Não foi possível extrair a análise automática. Tente novamente.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao conectar com a IA do Google.");
      setAnaliseResultado("Ocorreu um erro no processamento do palpite.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-3xl bg-slate-800 rounded-xl p-8 shadow-2xl border border-slate-700">
        
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-emerald-400 mb-2">
            🤖 MODO IA - BUSCA DE PALPITES GLOBAIS
          </h1>
          <p className="text-slate-400 text-sm">
            Digite qualquer jogo do mundo. Nossa IA varre os bancos de dados, notícias e redes sociais em tempo real.
          </p>
        </div>

        {/* Formulário de Busca */}
        <form onSubmit={buscarPalpiteIA} className="flex gap-3 mb-6">
          <input
            type="text"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Ex: Real Madrid x Barcelona hoje, Flamengo vs Palmeiras..."
            className="flex-1 bg-slate-950 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
            disabled={carregando}
          />
          <button
            type="submit"
            disabled={carregando}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {carregando ? "Buscando..." : "Gerar Palpite"}
          </button>
        </form>

        {/* Janela de Resultados (Modo IA do Google) */}
        <div className="bg-slate-950 rounded-lg p-6 border border-slate-700 min-h-[250px] flex flex-col justify-start">
          <div className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Relatório Profissional Realista
          </div>
          
          {carregando && (
            <div className="flex flex-col items-center justify-center my-auto text-slate-400 gap-2">
              <div className="w-8 h-8 border-4 border-t-emerald-400 border-slate-700 rounded-full animate-spin"></div>
              <p className="text-sm">Analisando o mercado global de apostas...</p>
            </div>
          )}

          {!carregando && !analiseResultado && (
            <p className="text-slate-500 text-center my-auto italic">
              Aguardando sua pesquisa para iniciar a varredura profunda...
            </p>
          )}

          {!carregando && analiseResultado && (
            <div className="text-slate-200 leading-relaxed whitespace-pre-wrap text-sm select-text">
              {analiseResultado}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
