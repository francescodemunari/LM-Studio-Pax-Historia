const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

// Initialize OpenAI client pointing to LM Studio
let baseURL = process.env.LLM_API_URL || 'http://127.0.0.1:1234/v1';
if (baseURL.includes('/api/v1')) {
    // Keep it as is
} else if (!baseURL.endsWith('/v1')) {
    baseURL = baseURL.replace(/\/$/, '') + '/v1';
}

const openai = new OpenAI({
    baseURL: baseURL,
    apiKey: 'lm-studio'
});

// System prompts for different contexts
const PROMPTS = {
    GAME_MASTER: `Sei il Game Master e Simulatore di una simulazione storica della Seconda Guerra Mondiale (1935-1945).
IL TUO RUOLO: Sei l'architetto del destino. Devi elaborare le conseguenze delle azioni del giocatore e generare eventi mondiali realistici.

REGOLE DI SIMULAZIONE:
1. CONSEQUENZIALITÀ: Ogni azione ha un peso. Se l'Italia attacca l'Etiopia, il Regno Unito deve reagire. Se il giocatore mobilita truppe, le tensioni aumentano.
2. REALISMO STORICO-DINAMICO: Segui la storia, ma permetti deviazioni plausibili (Alt-History). Non bloccare il giocatore, ma punisci/premialo con eventi realistici.
3. STATO DEL MONDO: Analizza attentamente la situazione attuale, la mappa e la cronologia degli eventi.

FORMATO RISPOSTA (JSON):
{
    "consequences": "Analisi in italiano...",
    "events": [
        {
            "title": "Titolo in italiano",
            "description": "Descrizione in italiano",
            "event_type": "political|military|economic|diplomatic|social",
            "severity": "minor|moderate|major|critical",
            "affected_nations": ["GER", "ITA"],
            "state_changes": {
                "NATION_CODE": {
                    "stability": +/-X,
                    "war_support": +/-X,
                    "treasury": +/-X,
                    "occupied_regions": ["REGION_ID", ...]
                }
            }
        }
    ],
    "global_tension_delta": X
}
 Assicurati di usare esattamente le chiavi "events", "title", "description", "event_type", "severity", "affected_nations" e "state_changes".
IMPORTANTE: Non usare il segno '+' per i numeri positivi nel JSON (es. usa 5 invece di +5).`,

    GAME_MASTER: `Sei il Game Master di "Pax Historia", un simulatore di grande strategia 1935-1945 ad alta fedeltà storica.
IL TUO COMPITO: Generare eventi mondiali realistici, specifici e geograficamente accurati.

REGOLE DI GENERAZIONE:
1. **CRONOLOGIA STORICA**: Consulta sempre la ROADMAP STORICA della nazione ({nation_code}) e delle nazioni confinanti. Se è il {current_date}, gli eventi devono riflettere la realtà storica di quel periodo (es. Guerra d'Etiopia attiva se 1935).
2. **SPECIFICITÀ GEOGRAFICA**: Non dire "l'esercito avanza". Di' "Le truppe del generale Badoglio avanzano verso Makalè" o "Le forze etiopi si arroccano sull'Amba Alagi". Cita città, fiumi e rilievi reali.
3. **MANDATORY TAGS**: Usa sempre i tag nazione in parentesi quadre (es. [ITA], [ETH]).
4. **DETTAGLIO MILITARE**: Gli eventi devono menzionare unità specifiche (es. 2^ Divisione Eritrea, Alpini, Guardie Imperiali).

ROADMAP STORICA RILEVANTE: {historical_context}
CONTESTO MONDIALE ATTUALE: {world_context}`,

    ADVISOR: `Sei l'Alto Consigliere Strategico di {nation_name} nel {current_date}. 
IL TUO MANDATO: Fornire analisi FREDDE, PRECISE e STORICAMENTE FONDATE, agendo come una bussola strategica che aiuta il leader a evitare i fallimenti del passato e a perseguire gli obiettivi nazionali con saggezza.

ROADMAP E STORIA NAZIONALE:
{historical_context_specific}

REGOLE DI FERRO:
1. **STORIA COMPLETA E PSICHE**: Usa la sezione "STORIA E PSICHE NAZIONALE" per capire a fondo le motivazioni, i traumi e le ambizioni della nazione. I tuoi consigli devono riflettere questa identità nazionale.
2. **MISTAKE PREVENTION**: Usa la sezione "ERRORI STORICI DA EVITARE" per mettere in guardia il giocatore. Se il giocatore sta prendendo una strada che storicamente ha portato al disastro, intervieni con fermezza.
2. **DILEMMI STRATEGICI**: Considera i dilemmi storici reali della nazione nell'offrire i tuoi consigli.
3. **GEOGRAFIA REALE**: Ogni consiglio deve essere ancorato a località reali (es. "Fortificare il passo di Mai Ceu", "Proteggere i rifornimenti verso Massaua").
4. **TAGS**: Usa sempre [TAG] per le nazioni.
5. **CONCISE MODE**: Se il giocatore invia SOLO un messaggio breve e informale (es. "OK", "Ciao", "Capito", "Bene", "Va bene"), rispondi con UNA SOLA FRASE MOLTO BREVE (massimo 10-15 parole). NON usare il formato completo con sezioni. Esempi: "Eccellente. Attendo i vostri ordini, Eccellenza." o "Ai vostri ordini, mio signore."

RISPONDI SEMPRE SEGUENDO QUESTO SCHEMA (ECCETTO per messaggi brevi, vedi regola 5):
---
### 📊 ANALISI STORICO-STRATEGICA
[Analisi basata sulla roadmap reale, i dilemmi storici e la situazione attuale. Cita eventi specifici.]

### 🎯 ORDINI MILITARI E DIPLOMATICI
1. [Azione specifica con Luogo e TAG]
2. [Azione specifica con Luogo e TAG]

### ⚠️ INTELLIGENCE E PREVENZIONE ERRORI
- [Fornisci un avvertimento basato specificamente sugli errori storici della nazione se applicabile, o su rischi reali del periodo]
---`,

    DIPLOMACY: `We are making a turn-based strategy game where the player can engage in diplomacy. We need you to simulate this diplomacy by roleplaying as all of the polities in this chat.

PARTICIPANTS: {participants}
PLAYER POLITY: {player_polity}
CURRENT DATE: {current_date}

**Instructions for Roleplay:**
1. PROFESSIONALISM: You are a competent polity. No nonsense. Straight to the point.
2. OPEN-MINDEDNESS: Be receptive to propositions, but ALWAYS move towards a solid answer (accept/refuse). 
3. TONE MATCHING: Your tone should MATCH the tone of the player ({player_polity}), leaning towards professionalism over slang.
4. CHARACTERS: No random math symbols orhashtags. No third-person speaking.

**Output Length Rule (CRITICAL):**
No matter what, the size of your message will ALWAYS match the average size of the player's messages in this specific chat ({player_avg_length} characters).
Match the characters count, plus or minus 10 Percent. NEVER BREAK THIS RULE.

**World Context:**
World Context Before Round One:
{world_context}

Simulation Rules:
{sim_rules}

Current Event History:
{event_history}

Responding as: {responding_polity_name}`
};


/**
 * Load historical roadmap from file
 */
function loadHistoricalRoadmap() {
    try {
        const roadmapPath = path.join(__dirname, '../../data/historical_roadmaps.json');
        if (fs.existsSync(roadmapPath)) {
            return JSON.parse(fs.readFileSync(roadmapPath, 'utf8'));
        }
    } catch (error) {
        console.error('[LLM] Failed to load historical roadmap:', error.message);
    }
    return {};
}

/**
 * Get historical context for a nation
 */
function getHistoricalRoadmapContext(nationCode) {
    const roadmaps = loadHistoricalRoadmap();
    const data = roadmaps[nationCode];

    if (!data) {
        return `Non ci sono milestone specifiche per la nazione ${nationCode} in questo archivio. 
Mantieni comunque un tono realistico coerente con il periodo 1935-1945.`;
    }

    if (Array.isArray(data)) {
        // Fallback for old simple array structure
        return data.join('\n');
    }

    let context = `--- PROFILO E STORIA NAZIONALE (${nationCode}) ---\n`;
    context += `PROFILO: ${data.profile || 'Nessuno'}\n\n`;

    if (data.narrative_history) {
        context += `STORIA E PSICHE NAZIONALE:\n${data.narrative_history}\n\n`;
    }

    if (data.strategic_dilemmas && data.strategic_dilemmas.length > 0) {
        context += `DILEMMI STRATEGICI:\n- ${data.strategic_dilemmas.join('\n- ')}\n\n`;
    }

    if (data.historical_mistakes && data.historical_mistakes.length > 0) {
        context += `ERRORI STORICI DA EVITARE:\n- ${data.historical_mistakes.join('\n- ')}\n\n`;
    }

    if (data.milestones && data.milestones.length > 0) {
        context += `ROADMAP CRONOLOGICA:\n- ${data.milestones.join('\n- ')}`;
    }

    return context;
}

/**
 * Process world turn and generate events
 */
async function generateEvents(timeJump, gameContext) {
    const nationCode = gameContext.playerNation?.code || 'ITA';
    const historicalContext = getHistoricalRoadmapContext(nationCode);

    const systemPrompt = PROMPTS.GAME_MASTER
        .replace(/{nation_code}/g, nationCode)
        .replace(/{current_date}/g, gameContext.currentDate)
        .replace(/{historical_context}/g, historicalContext)
        .replace(/{world_context}/g, gameContext.worldContext || 'Nessuno');

    const messages = [
        { role: 'system', content: systemPrompt },
        {
            role: 'user',
            content: `SIMULAZIONE TURNO:
Salto temporale: ${timeJump}
Data di inizio: ${gameContext.currentDate}
Nazione Giocatore: ${gameContext.playerNation.name}

AZIONI PENDENTI DEL GIOCATORE:
${JSON.stringify(gameContext.actions, null, 2)}

STORICO EVENTI RECENTI:
${JSON.stringify(gameContext.recentEvents, null, 2)}

STATO MONDIALE:
${JSON.stringify(gameContext.worldState, null, 2)}

REGOLE DI SIMULAZIONE (Simulation Rules):
${gameContext.simulationRules || 'Nessuna'}

Genera almeno 3-6 eventi significativi e le conseguenze per questo periodo (${timeJump}). 
Ogni evento DEVE essere realistico, impattante e coerente con la situazione attuale.
Rispondi SOLO in JSON conforme al formato richiesto.`
        }
    ];

    try {
        const response = await openai.chat.completions.create({
            model: process.env.LLM_MODEL || 'qwen3-vl-8b',
            messages: messages,
            temperature: 0.7,
            max_tokens: 3000
        });

        let content = response.choices[0].message.content;

        // DEBUG: Save raw response for inspection
        try {
            const debugDir = path.join(__dirname, '../../data/debug');
            if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
            fs.writeFileSync(path.join(debugDir, 'last_ai_response.txt'), content);
        } catch (e) {
            console.warn('[LLM] Failed to save debug log:', e.message);
        }

        // Clean markdown if present
        if (content.includes('```json')) {
            content = content.split('```json')[1].split('```')[0];
        } else if (content.includes('```')) {
            content = content.split('```')[1].split('```')[0];
        }

        // Fix common AI JSON errors: leading '+' signs on numbers
        content = content.replace(/:\s*\+(\d+(\.\d*)?)/g, ': $1');

        try {
            return JSON.parse(content);
        } catch (e) {
            // Robust regex fallback if JSON.parse fails
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw e;
        }
    } catch (error) {
        console.error('Event Generation Error:', error);
        return { events: [], error: error.message };
    }
}

/**
 * High-fidelity diplomatic chat
 */
async function diplomaticChat(message, fromNation, toNation, chatHistory = [], context = {}) {
    // Calculate player's average message length
    const playerMessages = chatHistory.filter(m => m.sender_is_player);
    const avgLength = playerMessages.length > 0
        ? Math.round(playerMessages.reduce((acc, m) => acc + m.message_text.length, 0) / playerMessages.length)
        : message.length; // Fallback to current message length if first message

    const systemPrompt = PROMPTS.DIPLOMACY
        .replace(/{participants}/g, context.participants || `${fromNation.name}, ${toNation.name}`)
        .replace(/{player_polity}/g, fromNation.name)
        .replace(/{current_date}/g, context.currentDate || new Date().toISOString())
        .replace(/{player_avg_length}/g, avgLength)
        .replace(/{world_context}/g, context.worldContext || "Historical 1936 start.")
        .replace(/{sim_rules}/g, context.simRules || "Standard Grand Strategy rules.")
        .replace(/{event_history}/g, JSON.stringify(context.eventHistory || [], null, 2))
        .replace(/{responding_polity_name}/g, toNation.name);

    const messages = [
        { role: 'system', content: systemPrompt },
        ...chatHistory.map(msg => ({
            role: msg.sender_is_player ? 'user' : 'assistant',
            content: msg.message_text
        })),
        { role: 'user', content: message }
    ];

    try {
        const response = await openai.chat.completions.create({
            model: process.env.LLM_MODEL || 'qwen3-vl-8b',
            messages: messages,
            temperature: 0.8,
            max_tokens: 1000
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error('Diplomacy Error:', error);
        return `[Communication Error: ${error.message}]`;
    }
}

/**
 * Standard Advisor Response - Updated for High Fidelity
 */
async function getAdvisorResponse(question, advContext) {
    const nation = advContext.playerNation;
    const historicalContext = getHistoricalRoadmapContext(nation.code);

    const systemPrompt = PROMPTS.ADVISOR
        .replace(/{nation_name}/g, nation.name)
        .replace(/{current_date}/g, advContext.currentDate)
        .replace(/{historical_context_specific}/g, historicalContext);

    const messages = [
        { role: 'system', content: systemPrompt },
        {
            role: 'user',
            content: `SITUAZIONE ATTUALE (${advContext.currentDate}):
Nazione: ${nation.name} (${nation.code})
Guerre in corso: ${nation.atWar ? 'Sì' : 'No'}
Regioni Occupate: ${nation.occupied_regions?.join(', ') || 'Nessuna'}

STATO DEL MONDO (Nazioni Rilevanti):
${JSON.stringify(advContext.worldState, null, 2)}

ULTIMI EVENTI MONDIALI:
${JSON.stringify(advContext.recentEvents, null, 2)}

AZIONI GIOCATORE IN CORSO:
${JSON.stringify(advContext.pendingActions, null, 2)}

DOMANDA DEL SOVRANO: "${question}"`
        }
    ];

    try {
        const response = await openai.chat.completions.create({
            model: process.env.LLM_MODEL || 'qwen3-vl-8b',
            messages: messages,
            temperature: 0.7
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error('Advisor Error:', error);
        return `Errore consigliere: ${error.message}`;
    }
}

module.exports = {
    generateEvents,
    diplomaticChat,
    getAdvisorResponse,
    PROMPTS
};
