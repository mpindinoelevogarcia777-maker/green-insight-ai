// Configuração da sua Chave de API Gratuita do Gemini
const GEMINI_API_KEY = "AQ.Ab8RN6JxuUltcuPOFVZxzbiLaAPr_Fwvy3EqrwR3XaRngjv0BQ";

export type AnalysisResult = {
  sport: "futebol" | "basquetebol";
  home_team: string;
  away_team: string;
  ai_analysis: string; // Aqui vai o texto corrido e detalhado da IA
};

export async function analyzeMatch(query: string): Promise<AnalysisResult> {
  // Usando o modelo mais atual com suporte a buscas na internet em tempo real (Google Search Grounding)
  const url = `https://googleapis.com{GEMINI_API_KEY}`;

  const prompt = `Você é um analista de apostas esportivas profissional, focado em trazer palpites realistas e profissionais.
  O usuário digitou na barra de pesquisa: "${query}".
  
  Sua tarefa é usar sua ferramenta de busca na internet (Google Search) em tempo real para encontrar:
  - Notícias recentes dos times nas redes sociais e portais de esportes.
  - Informações sobre desfalques, jogadores suspensos ou escalações prováveis.
  - O clima do jogo e análises profissionais de tipsters na internet.
  
  Com base nisso, escreva uma resposta completa, amigável e muito profissional, conversando diretamente com o usuário. Explique os pontos fortes de cada lado e, no final, dê uma recomendação clara de aposta (Ex: Mercado de Gols, Vitória ou Ambas Marcam).
  
  Importante: Formate o texto de forma bonita com tópicos e negritos.`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        // Ativa a ferramenta de busca na internet integrada do Google
        tools: [{ googleSearch: {} }] 
      })
    });

    if (!response.ok) throw new Error("Erro na comunicação com o Gemini");

    const data = await response.json();
    // Extrai o texto livre gerado pela inteligência artificial
    const aiText = data.candidates[0].content.parts[0].text;

    return {
      sport: "futebol",
      home_team: "Análise",
      away_team: "Concluída",
      ai_analysis: aiText
    };

  } catch (error) {
    console.error("Erro na análise da IA:", error);
    return {
      sport: "futebol",
      home_team: "Erro",
      away_team: "Erro",
      ai_analysis: "Olá! Infelizmente não consegui navegar na internet para analisar esse jogo agora. Verifique se a sua chave de IA atingiu os limites gratuitos diários."
    };
  }
}
