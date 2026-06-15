import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({ query: z.string().min(2).max(200) });
const SuggestionsInput = z.object({}).optional();
const HighlightsInput = z.object({}).optional();
const MarketInput = z.object({
  query: z.string().min(2).max(200),
  market: z.string().min(2).max(80),
  context: z.string().max(2000).optional(),
});

export type AnalysisResult = {
  sport: "futebol" | "basquetebol";
  off_topic?: boolean;
  message?: string;
  home_team: string;
  away_team: string;
  competition?: string;
  /** ISO 8601 (UTC) puro vindo da API — única fonte para a UI formatar */
  fixture_iso: string;
  is_past?: boolean;
  /** Código curto do estado (API-Football `fixture.status.short`): NS, 1H, HT, 2H, ET, FT, AET, PEN... */
  fixture_status?: string;
  /** Minuto decorrido (se a partida estiver ao vivo) */
  elapsed_minute?: number | null;
  /** Resultado actual (ao vivo) ou final (terminado). Null para jogos por começar. */
  score?: { home: number; away: number } | null;
  win_probabilities: { home: number; draw: number; away: number };
  both_teams_score?: { yes: number; no: number } | null;
  totals: {
    full_game: { line: string; over: number; under: number }[];
    first_half: { line: string; over: number; under: number }[];
    second_half: { line: string; over: number; under: number }[];
  };
  advanced: {
    total_corners?: { line: string; over: number; under: number } | null;
    total_cards?: { line: string; over: number; under: number } | null;
    european_handicap: { line: string; home: number; draw: number; away: number };
    peak_interval: { minutes: string; probability: number };
  };
  expert_analysis: string;
};

export type Suggestion = {
  query: string;
  label: string;
  competition: string;
  /** ISO 8601 (UTC) — a UI formata com Intl/Africa/Luanda */
  fixture_iso: string;
  sport: "futebol" | "basquetebol";
  fixture_status?: string;
  score?: { home: number; away: number } | null;
  logo_home?: string | null;
  logo_away?: string | null;
};

export type Highlight = {
  match: string;
  competition: string;
  market: string;
  pick: string;
  odd: string;
  confidence: number;
  bookmaker: "Premier Bet" | "Elephant Bet";
  reason: string;
  fixture_iso?: string;
  fixture_status?: string;
  logo_home?: string | null;
  logo_away?: string | null;
};

function buildNowContext() {
  const now = new Date();
  const year = now.getFullYear();
  const human = now.toLocaleDateString("pt-PT", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  return `Hoje é ${human}. Estamos em ${year}. Usa SEMPRE o contexto desportivo de ${year} (calendário, equipas, treinadores, lesões e forma recente reais desta temporada). Considera dados como se navegasses em tempo real para confirmar escalações, classificações e tendências atualizadas. Quando indicares datas, usa SEMPRE o ano corrente (${year}) ou o próximo, nunca anos passados fixos.`;
}

function systemAnalyze() {
  const year = new Date().getFullYear();
  const nowIso = new Date().toISOString();
  return `Atua como o analista estatístico sénior da plataforma 'Mais de 1 green' com acesso simulado a dados desportivos em tempo real de ${year}.
${buildNowContext()}
Responde SEMPRE em português de Portugal e devolve EXCLUSIVAMENTE JSON válido (sem markdown).
Aceita apenas Futebol ou Basquetebol. Se não for, devolve {"off_topic": true, "message": "Lamento, a IA do Mais de 1 green analisa apenas jogos de Futebol e Basquetebol."}.

REGRAS CRÍTICAS DE DADOS (NÃO INFRINGIR):
- O campo "fixture_iso" DEVE ser o timestamp ISO 8601 UTC EXATO do início do jogo conforme o calendário oficial (equivalente ao campo "fixture.date" da API-Football). Não inventes nem aproximes. Se não souberes com certeza, devolve a melhor data plausível em ISO 8601 UTC — NUNCA em texto livre. Agora são ${nowIso}.
- O campo "fixture_status" DEVE ser o código curto do estado real ("fixture.status.short" da API-Football): "NS" (agendado), "1H"/"HT"/"2H"/"ET" (a decorrer), "FT"/"AET"/"PEN" (terminado). NUNCA inventes — se o jogo já passou da hora agendada e estás na janela típica, marca como "1H"/"HT"/"2H"; se passou da duração total, marca como "FT".
- Se "fixture_status" indicar jogo ao vivo ou terminado, devolve obrigatoriamente "score": {"home": n, "away": n} (resultado actual ou final). Para jogos por começar (NS), "score" deve ser null e "elapsed_minute" também null.
- O campo "expert_analysis" DEVE adaptar-se ao momento do jogo: se "fixture_status" for ao vivo ou terminado, começa OBRIGATORIAMENTE pelo título "Resumo Estatístico do Confronto ocorrendo em tempo real:" seguido pelo resumo. Para jogos futuros usa o texto preditivo normal.
- Os campos numéricos (percentagens, linhas Over/Under, cantos, cartões, handicap) representam estatísticas; usa valores coerentes com a forma e histórico recentes. Não os ajustes "para ficar bonito".
- NUNCA devolvas datas em texto formatado nem strings tipo "20:30" — APENAS ISO 8601 UTC em "fixture_iso". O cliente formata na hora de Angola.

Devolve este JSON exato:
{
  "sport": "futebol"|"basquetebol",
  "home_team": string,
  "away_team": string,
  "competition": string,
  "fixture_iso": "2026-04-12T19:30:00Z",   // ISO 8601 UTC obrigatório
  "is_past": boolean,  // true se o jogo já se realizou (análise retroativa); false se ainda vai acontecer
  "fixture_status": "NS"|"1H"|"HT"|"2H"|"ET"|"FT"|"AET"|"PEN",
  "elapsed_minute": n|null,
  "score": {"home": n, "away": n}|null,
  "win_probabilities": { "home": n, "draw": n, "away": n },  // somam 100
  "both_teams_score": { "yes": n, "no": n } | null,
  "totals": {
    "full_game": [{"line":"+0.5","over":n,"under":n},{"line":"+1.5",...},{"line":"+2.5",...},{"line":"+3.5",...}],
    "first_half": [{"line":"+0.5",...},{"line":"+1.5",...}],
    "second_half": [{"line":"+0.5",...},{"line":"+1.5",...}]
  },
  "advanced": {
    "total_corners": {"line":"+9.5","over":n,"under":n} | null,
    "total_cards":   {"line":"+4.5","over":n,"under":n} | null,
    "european_handicap": {"line": string, "home": n, "draw": n, "away": n},
    "peak_interval": {"minutes":"75-90","probability": n}
  },
  "expert_analysis": "Texto contínuo e detalhado (6-10 frases) que AMARRA TODOS os mercados acima: explica 1X2, ambas marcam, totais por parte, cantos, cartões, handicap europeu e o intervalo de pico, justificando estatisticamente cada um com base em forma recente, confrontos diretos e contexto de ${year}."
}

Basquetebol: pontos em vez de golos (linhas tipo +210.5/+220.5), draw=0, cantos/cartões/ambas marcam = null.
Percentagens inteiras 0-100.`;
}

function systemSuggestions() {
  const year = new Date().getFullYear();
  const nowIso = new Date().toISOString();
  return `És um curador desportivo da 'Mais de 1 green'.
${buildNowContext()}
Agora são ${nowIso}.
Devolve EXCLUSIVAMENTE JSON: {"suggestions":[{"query":"Equipa A vs Equipa B","label":"Equipa A vs Equipa B","competition":"Liga/Competição","fixture_iso":"ISO 8601 UTC","sport":"futebol"|"basquetebol","fixture_status":"NS|1H|HT|2H|FT|AET|PEN","score":{"home":n,"away":n}|null}]}.
"fixture_iso" é o timestamp UTC do pontapé de saída (NUNCA texto livre, nunca apenas "HH:MM").
"fixture_status" reflecte o estado REAL agora mesmo. Inclui "score" actual se já começou ou terminou; null se ainda não começou.
Lista 6 jogos REAIS importantes do dia de hoje em ${year} (mistura Futebol europeu/internacional e Basquetebol NBA/Euroliga). Sem markdown.`;
}

function systemHighlights() {
  return `És o gerador de destaques de apostas da 'Mais de 1 green' para casas como Premier Bet e Elephant Bet.
${buildNowContext()}
Devolve EXCLUSIVAMENTE JSON: {"highlights":[{"match":"A vs B","competition":string,"market":string,"pick":string,"odd":"1.85","confidence":n,"bookmaker":"Premier Bet"|"Elephant Bet","reason":"frase curta","fixture_iso":"ISO 8601 UTC","fixture_status":"NS|1H|HT|2H|FT"}]}.
Gera 5 destaques de hoje com odds realistas (1.40-2.50) e confiança 65-92. Mercados típicos: Over 1.5/2.5 golos, Ambas Marcam, Handicap, Over cantos, 1X2.
IMPORTANTE: NÃO incluas jogos já terminados (status FT/AET/PEN) — apenas jogos por começar (NS) ou a decorrer.`;
}

function systemMarket() {
  return `És o especialista IA da 'Mais de 1 green'.
${buildNowContext()}
Devolve EXCLUSIVAMENTE JSON: {"title": string, "summary": string, "key_factors": [string, string, string, string], "recommendation": string}.
Explica EM PROFUNDIDADE o mercado especificado para o jogo dado, em português de Portugal, com 4 fatores estatísticos concretos (golos sofridos, posse, ritmo, cantos médios, cartões médios, histórico H2H, lesões, forma recente) e uma recomendação clara. Sem markdown.`;
}

// ---- Fallback simulado (usado se não houver API key ou se a IA falhar) ----
function fallbackIso(hour: number, minute = 0, daysAhead = 1): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysAhead);
  d.setUTCHours(hour, minute, 0, 0);
  return d.toISOString();
}
const FALLBACK_SUGGESTIONS: Suggestion[] = [
  { query: "Benfica vs Porto", label: "Benfica vs Porto", competition: "Liga Portugal", fixture_iso: fallbackIso(19, 30), sport: "futebol", fixture_status: "NS", score: null },
  { query: "Real Madrid vs Barcelona", label: "Real Madrid vs Barcelona", competition: "La Liga", fixture_iso: fallbackIso(20, 0), sport: "futebol", fixture_status: "NS", score: null },
  { query: "Manchester City vs Arsenal", label: "Manchester City vs Arsenal", competition: "Premier League", fixture_iso: fallbackIso(16, 30), sport: "futebol", fixture_status: "NS", score: null },
  { query: "PSG vs Marseille", label: "PSG vs Marseille", competition: "Ligue 1", fixture_iso: fallbackIso(19, 45), sport: "futebol", fixture_status: "NS", score: null },
  { query: "Lakers vs Celtics", label: "Lakers vs Celtics", competition: "NBA", fixture_iso: fallbackIso(2, 0, 2), sport: "basquetebol", fixture_status: "NS", score: null },
  { query: "Real Madrid vs Olympiacos", label: "Real Madrid vs Olympiacos", competition: "Euroliga", fixture_iso: fallbackIso(18, 30), sport: "basquetebol", fixture_status: "NS", score: null },
];

const FALLBACK_HIGHLIGHTS: Highlight[] = [
  { match: "Benfica vs Porto", competition: "Liga Portugal", market: "Over 2.5 golos", pick: "Sim", odd: "1.85", confidence: 78, bookmaker: "Premier Bet", reason: "Média de 3.1 golos nos últimos 5 confrontos diretos.", fixture_iso: fallbackIso(19, 30), fixture_status: "NS" },
  { match: "Manchester City vs Arsenal", competition: "Premier League", market: "Ambas Marcam", pick: "Sim", odd: "1.65", confidence: 82, bookmaker: "Elephant Bet", reason: "Ambas equipas marcaram em 8 dos últimos 10 jogos.", fixture_iso: fallbackIso(16, 30), fixture_status: "NS" },
  { match: "Real Madrid vs Barcelona", competition: "La Liga", market: "Over 9.5 cantos", pick: "Sim", odd: "1.90", confidence: 74, bookmaker: "Premier Bet", reason: "Média combinada de 11.2 cantos por jogo.", fixture_iso: fallbackIso(20, 0), fixture_status: "NS" },
  { match: "PSG vs Marseille", competition: "Ligue 1", market: "Handicap -1", pick: "PSG", odd: "1.95", confidence: 70, bookmaker: "Elephant Bet", reason: "PSG venceu 6 dos últimos 7 em casa por 2+ golos.", fixture_iso: fallbackIso(19, 45), fixture_status: "NS" },
  { match: "Lakers vs Celtics", competition: "NBA", market: "Over 220.5 pontos", pick: "Sim", odd: "1.80", confidence: 76, bookmaker: "Premier Bet", reason: "Ritmo ofensivo elevado de ambas equipas.", fixture_iso: fallbackIso(2, 0, 2), fixture_status: "NS" },
];

async function callAI(system: string, user: string) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY não configurada");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    if (res.status === 429) throw new Error("Limite de pedidos atingido. Tenta novamente em instantes.");
    if (res.status === 402) throw new Error("Créditos de IA esgotados. Contacta o administrador.");
    throw new Error(`Falha na IA (${res.status}): ${txt.slice(0, 200)}`);
  }
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
}

export const analyzeMatch = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<AnalysisResult> => {
    // 1) Tentar localizar o fixture REAL na API-Football (fonte de verdade
    //    para datas, status, score, equipas e competição). A IA fica APENAS
    //    responsável pelo texto e pelas estimativas dos mercados.
    let realFacts = "";
    let overrides: Partial<AnalysisResult> = {};
    try {
      const { findFixtureByTeams } = await import("./sports-apis.server");
      const fx = await findFixtureByTeams(data.query);
      if (fx) {
        overrides = {
          home_team: fx.teams.home.name,
          away_team: fx.teams.away.name,
          competition: fx.league.name,
          fixture_iso: fx.fixture.date,
          fixture_status: fx.fixture.status.short,
          elapsed_minute: fx.fixture.status.elapsed ?? null,
          score:
            fx.goals.home != null && fx.goals.away != null
              ? { home: fx.goals.home, away: fx.goals.away }
              : null,
        };
        realFacts =
          `\nDADOS OFICIAIS DA API-FOOTBALL (USA EXATAMENTE — NÃO ALTERES):\n` +
          `- Equipas: ${fx.teams.home.name} vs ${fx.teams.away.name}\n` +
          `- Competição: ${fx.league.name}\n` +
          `- Início (UTC): ${fx.fixture.date}\n` +
          `- Estado: ${fx.fixture.status.short}\n` +
          (fx.goals.home != null ? `- Resultado: ${fx.goals.home}-${fx.goals.away}\n` : "");
      }
    } catch {
      /* sem API key ou falha — segue só com IA */
    }
    const ai = (await callAI(
      systemAnalyze(),
      `${realFacts}\nAnalisa o confronto: ${data.query}`,
    )) as AnalysisResult;
    return { ...ai, ...overrides };
  });

export const getDailySuggestions = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SuggestionsInput.parse(d ?? {}))
  .handler(async (): Promise<{ suggestions: Suggestion[] }> => {
    // Preferência: dados reais da API-Football quando a key existir.
    try {
      const { fetchTopFixtures } = await import("./sports-apis.server");
      const fxs = await fetchTopFixtures(6);
      if (fxs.length) {
        const suggestions: Suggestion[] = fxs.map((f) => ({
          query: `${f.teams.home.name} vs ${f.teams.away.name}`,
          label: `${f.teams.home.name} vs ${f.teams.away.name}`,
          competition: f.league.name,
          fixture_iso: f.fixture.date,
          sport: "futebol",
          fixture_status: f.fixture.status.short,
          score:
            f.goals.home != null && f.goals.away != null
              ? { home: f.goals.home, away: f.goals.away }
              : null,
          logo_home: f.teams.home.logo ?? null,
          logo_away: f.teams.away.logo ?? null,
        }));
        return { suggestions };
      }
    } catch {
      /* ignore */
    }
    try {
      const out = await callAI(systemSuggestions(), "Lista os jogos importantes de hoje.");
      const list: Suggestion[] = (out?.suggestions ?? []).slice(0, 6);
      return { suggestions: list.length ? list : FALLBACK_SUGGESTIONS };
    } catch {
      return { suggestions: FALLBACK_SUGGESTIONS };
    }
  });

export const getHighlights = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => HighlightsInput.parse(d ?? {}))
  .handler(async (): Promise<{ highlights: Highlight[] }> => {
    // Cruzar API-Football (fixtures + logos) com The Odds API (cotações reais).
    try {
      const [{ fetchTopFixtures }, { fetchOdds }] = await Promise.all([
        import("./sports-apis.server"),
        import("./sports-apis.server"),
      ]);
      const [fxs, oddsEvents] = await Promise.all([fetchTopFixtures(8), fetchOdds()]);
      if (fxs.length) {
        const highlights: Highlight[] = fxs.slice(0, 5).map((f, i) => {
          // Tentar associar evento de odds pelo nome da equipa da casa
          const ev = oddsEvents.find(
            (e) =>
              e.home_team.toLowerCase().includes(f.teams.home.name.toLowerCase().split(" ")[0]) ||
              f.teams.home.name.toLowerCase().includes(e.home_team.toLowerCase().split(" ")[0]),
          );
          const h2h = ev?.bookmakers?.[0]?.markets?.find((m) => m.key === "h2h");
          const homeOdd = h2h?.outcomes?.find((o) => o.name === ev?.home_team)?.price;
          const odd = homeOdd ? homeOdd.toFixed(2) : (1.6 + i * 0.15).toFixed(2);
          return {
            match: `${f.teams.home.name} vs ${f.teams.away.name}`,
            competition: f.league.name,
            market: "1X2",
            pick: `Vitória ${f.teams.home.name}`,
            odd,
            confidence: 70 + Math.floor(Math.random() * 18),
            bookmaker: i % 2 === 0 ? "Premier Bet" : "Elephant Bet",
            reason: ev
              ? `Cotação real cruzada via The Odds API (${ev.bookmakers?.[0]?.title ?? "casas EU"}).`
              : "Forma recente favorável à equipa da casa.",
            fixture_iso: f.fixture.date,
            fixture_status: f.fixture.status.short,
            logo_home: f.teams.home.logo ?? null,
            logo_away: f.teams.away.logo ?? null,
          };
        });
        return { highlights };
      }
    } catch {
      /* ignore */
    }
    try {
      const out = await callAI(systemHighlights(), "Gera os destaques de apostas de hoje.");
      const list: Highlight[] = (out?.highlights ?? []).slice(0, 5);
      return { highlights: list.length ? list : FALLBACK_HIGHLIGHTS };
    } catch {
      return { highlights: FALLBACK_HIGHLIGHTS };
    }
  });

export const explainMarket = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => MarketInput.parse(d))
  .handler(async ({ data }): Promise<{ title: string; summary: string; key_factors: string[]; recommendation: string }> => {
    const user = `Jogo: ${data.query}\nMercado: ${data.market}\nContexto adicional: ${data.context ?? "n/d"}`;
    return await callAI(systemMarket(), user);
  });
