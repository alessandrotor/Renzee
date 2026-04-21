/* ╔═══════════════════════════════════════════════════════════════════╗
   ║                                                                   ║
   ║  CALCULATOR.JS — Logica del Simulatore Bonus 2026                 ║
   ║                                                                   ║
   ║  GUIDA RAPIDA per chi vuole fare piccole modifiche:               ║
   ║                                                                   ║
   ║  • Le IMPOSTAZIONI MODIFICABILI sono tutte nella prima sezione    ║
   ║    qui sotto, raggruppate per categoria.                          ║
   ║                                                                   ║
   ║  • NON toccare le sezioni marcate "NON MODIFICARE" a meno che    ║
   ║    tu non sappia esattamente cosa stai facendo.                   ║
   ║                                                                   ║
   ╚═══════════════════════════════════════════════════════════════════╝ */


/* ═══════════════════════════════════════════════
   IMPOSTAZIONI MODIFICABILI
   Cambia questi valori per personalizzare il simulatore
   ═══════════════════════════════════════════════ */

const IMPOSTAZIONI = {

    // ── Durata animazione numeri ──────────────
    // In millisecondi (1000 = 1 secondo)
    // Più alto = animazione più lenta
    // Più basso = animazione più veloce
    DURATA_ANIMAZIONE: 400,

    // ── Colori dei badge risultato ──────────────
    // Formato: '#' seguito da 6 caratteri (codice colore esadecimale)
    // Puoi usare https://htmlcolorcodes.com per trovare i colori
    COLORE_IN_ATTESA: '#7a8898',       // Grigio (quando non ci sono dati)
    COLORE_BONUS_OK: '#2e7d52',        // Verde (quando il bonus spetta)
    COLORE_BONUS_PARZIALE: '#a07c2a',  // Ambra (avviso/bonus parziale)
    COLORE_BONUS_NO: '#8b2b2b',        // Rosso (bonus non spetta)

    // ── Colori barra progresso reddito ──────────
    COLORE_BARRA_VERDE: '#3eb36b',     // Zona bonus pieno (sotto 15.000€)
    COLORE_BARRA_GIALLO: '#c9a030',    // Zona bonus parziale (15.000-28.000€)
    COLORE_BARRA_ROSSO: '#c04048',     // Fuori soglia (sopra 28.000€)

    // ── Testi della barra progresso ──────────────
    TESTO_BARRA_VERDE: '● Bonus Pieno',
    TESTO_BARRA_GIALLO: '● Zona Parziale',
    TESTO_BARRA_ROSSO: '● Fuori Soglia',
};


/* ═══════════════════════════════════════════════
   PARAMETRI FISCALI
   Soglie, aliquote e importi previsti dalla normativa.
   Modifica SOLO se cambiano le regole fiscali.
   ═══════════════════════════════════════════════ */

const FISCALE = {

    // ── Soglie di reddito ──────────────────────
    SOGLIA_BONUS_PIENO: 15000,          // Sotto questa soglia → bonus pieno (1.200€)
    SOGLIA_BONUS_MAX: 28000,            // Sopra questa soglia → nessun bonus
    SOGLIA_IRPEF_ALTA: 28000,           // Sopra → aliquota IRPEF più alta
    SOGLIA_AFFITTO_GIOVANI: 15493.71,   // Limite reddito per affitto giovani
    SOGLIA_AFFITTO_PIENO: 15493,        // Sotto → detrazione affitto piena
    SOGLIA_AFFITTO_RIDOTTO: 30987,      // Sotto → detrazione affitto dimezzata
    SOGLIA_FIGLI: 95000,                // Limite reddito per detrazione figli
    SOGLIA_AVVISO_VICINO: 1000,         // Mostra avviso se mancano meno di X€

    // ── Aliquote ──────────────────────────────
    ALIQUOTA_IRPEF_BASSA: 0.23,         // 23% fino a 28.000€
    ALIQUOTA_IRPEF_ALTA: 0.35,          // 35% oltre 28.000€
    ALIQUOTA_DETRAZIONE: 0.19,          // 19% per spese sanitarie, trasporti, mutuo
    ALIQUOTA_AFFITTO_GIOVANI: 0.20,     // 20% del canone per under 31

    // ── Importi detrazioni ────────────────────
    DETRAZIONE_LAVORO_BASE: 1955,       // Detrazione lavoro sotto 15.000€
    DETRAZIONE_LAVORO_RIDOTTA: 1910,    // Base detrazione lavoro 15.000-28.000€
    DETRAZIONE_LAVORO_EXTRA: 1190,      // Aggiunta proporzionale al reddito
    DETRAZIONE_LAVORO_RANGE: 13000,     // Range per il calcolo proporzionale
    DETRAZIONE_FIGLI_PER_FIGLIO: 950,   // Per ogni figlio a carico
    DETRAZIONE_SANITA_FRANCHIGIA: 129.11, // Franchigia spese sanitarie
    DETRAZIONE_TRASPORTI_MAX: 250,      // Tetto massimo trasporti
    DETRAZIONE_MUTUO_MAX: 4000,         // Tetto massimo interessi mutuo
    DETRAZIONE_AFFITTO_GIOVANI_MIN: 991.60, // Minimo detrazione affitto giovani
    DETRAZIONE_AFFITTO_GIOVANI_MAX: 2000,   // Massimo detrazione affitto giovani

    // ── Bonus massimo ─────────────────────────
    BONUS_MASSIMO: 1200,                // Il bonus annuo massimo spettante
};


/* ═══════════════════════════════════════════════════════════════════
   ═══════════════════════ DA QUI IN POI ═══════════════════════════
   ═══════════════ NON MODIFICARE SE NON NECESSARIO ════════════════
   ═══════════════════════════════════════════════════════════════════ */


// ── Salvataggio dati nel browser ─────────────

function saveFormData() {
    const formData = {
        ral: document.getElementById('ral').value,
        altri: document.getElementById('altri').value,
        figli: document.getElementById('figli').value,
        sanita: document.getElementById('sanita').value,
        trasporti: document.getElementById('trasporti').value,
        mutuo: document.getElementById('mutuo').value,
        edilizia: document.getElementById('edilizia').value,
        affitto: document.getElementById('affitto').value,
        canone: document.getElementById('canone').value,
        modeToggle: document.getElementById('mode-toggle').checked
    };

    try {
        localStorage.setItem('bonusSimulatorData', JSON.stringify(formData));
    } catch (e) {
        console.error('Errore salvataggio dati:', e);
    }
}

function loadFormData() {
    const saved = localStorage.getItem('bonusSimulatorData');
    if (!saved) return false;

    try {
        const formData = JSON.parse(saved);
        Object.keys(formData).forEach(key => {
            if (key === 'modeToggle') {
                document.getElementById('mode-toggle').checked = formData[key];
            } else {
                const element = document.getElementById(key);
                if (element && formData[key] !== undefined) {
                    element.value = formData[key];
                }
            }
        });
        return true;
    } catch (e) {
        console.error('Errore caricamento dati salvati:', e);
        return false;
    }
}

let saveTimeout;
function debouncedSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveFormData, 500);
}

function clearSavedData() {
    if (confirm('Vuoi cancellare tutti i dati salvati e ricominciare da capo?')) {
        localStorage.removeItem('bonusSimulatorData');
        location.reload();
    }
}


// ── Cambio modalità Essenziale/Completo ──────

function toggleMode() {
    const toggle = document.getElementById('mode-toggle');
    const isFull = toggle.checked;
    const box = document.getElementById('main-box');

    toggle.setAttribute('aria-checked', isFull.toString());

    if (isFull) {
        box.classList.add('mode-full');
        document.querySelectorAll('.ess-only').forEach(el => el.style.display = 'none');
    } else {
        box.classList.remove('mode-full');
        document.querySelectorAll('.ess-only').forEach(el => el.style.display = 'flex');
    }
    calcola();
}


// ── Animazione contatore numerico ────────────

function animateCounter(elId, targetValue, suffix) {
    if (suffix === undefined) suffix = ' €';
    const el = document.getElementById(elId);
    if (!el) return;
    const from = parseFloat(el.dataset.lastVal) || 0;
    const to = Math.round(targetValue);
    el.dataset.lastVal = to;
    if (from === to) return;
    const duration = IMPOSTAZIONI.DURATA_ANIMAZIONE;
    const startTime = performance.now();
    el.classList.remove('val-pop');
    void el.offsetWidth;
    el.classList.add('val-pop');
    (function tick(now) {
        const t = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.innerText = Math.round(from + (to - from) * eased).toLocaleString() + suffix;
        if (t < 1) requestAnimationFrame(tick);
    })(startTime);
}


// ── Etichetta stipendio mensile sotto RAL ────

function updateRalMicro(ral) {
    const micro = document.getElementById('ral-micro');
    if (!micro) return;
    if (ral <= 0) { micro.innerText = ''; return; }
    micro.innerText = '≈ ' + Math.round(ral / 12).toLocaleString() + ' €/mese';
}


// ── Barra di progresso reddito ───────────────

function updateIncomeBar(complessivo) {
    const bar = document.getElementById('income-bar');
    const resultsData = document.getElementById('results-data');
    const emptyHint = document.getElementById('empty-hint');
    if (!bar) return;

    if (complessivo <= 0) {
        bar.style.display = 'none';
        if (resultsData) resultsData.style.display = 'none';
        if (emptyHint) emptyHint.style.display = 'flex';
        return;
    }

    bar.style.display = 'block';
    if (resultsData) resultsData.style.display = 'block';
    if (emptyHint) emptyHint.style.display = 'none';

    const fill = document.getElementById('income-fill');
    const barVal = document.getElementById('income-bar-val');
    const barStatus = document.getElementById('income-bar-status');
    const pct = Math.min((complessivo / FISCALE.SOGLIA_BONUS_MAX) * 100, 100);

    fill.style.width = pct + '%';
    barVal.innerText = complessivo.toLocaleString() + ' €';

    if (complessivo <= FISCALE.SOGLIA_BONUS_PIENO) {
        fill.style.background = IMPOSTAZIONI.COLORE_BARRA_VERDE;
        barStatus.innerText = IMPOSTAZIONI.TESTO_BARRA_VERDE;
        barStatus.style.color = IMPOSTAZIONI.COLORE_BARRA_VERDE;
    } else if (complessivo <= FISCALE.SOGLIA_BONUS_MAX) {
        fill.style.background = IMPOSTAZIONI.COLORE_BARRA_GIALLO;
        barStatus.innerText = IMPOSTAZIONI.TESTO_BARRA_GIALLO;
        barStatus.style.color = IMPOSTAZIONI.COLORE_BARRA_GIALLO;
    } else {
        fill.style.background = IMPOSTAZIONI.COLORE_BARRA_ROSSO;
        barStatus.innerText = IMPOSTAZIONI.TESTO_BARRA_ROSSO;
        barStatus.style.color = IMPOSTAZIONI.COLORE_BARRA_ROSSO;
    }
}


// ── Calcolo principale ──────────────────────

function calcola() {
    // Pulisci errori precedenti
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.classList.remove('invalid');
    });

    const val = (id) => {
        const element = document.getElementById(id);
        const value = parseFloat(element.value) || 0;
        if (element.value && value < 0) {
            element.classList.add('invalid');
        }
        return Math.max(0, value);
    };

    const ral = val('ral');
    const altri = val('altri');
    const complessivo = ral + altri;
    updateRalMicro(ral);

    const figli = parseInt(document.getElementById('figli').value) || 0;
    const sanita = val('sanita');
    const trasporti = val('trasporti');
    const mutuo = val('mutuo');
    const edilizia = val('edilizia');

    const affittoSelect = document.getElementById('affitto');
    const affittoValore = affittoSelect.value;
    const canoneAnnuo = val('canone');

    document.getElementById('box-canone').style.display = (affittoValore === 'giovani') ? 'block' : 'none';

    const gap = document.getElementById('alert-gap');
    const danger = document.getElementById('alert-danger');
    const info = document.getElementById('alert-info');
    gap.style.display = "none";
    danger.style.display = "none";
    info.style.display = "none";

    if (complessivo <= 0) {
        updateIncomeBar(0);
        document.getElementById('badge').style.background = IMPOSTAZIONI.COLORE_IN_ATTESA;
        document.getElementById('badge').innerText = "In attesa dati";
        return;
    }
    updateIncomeBar(complessivo);

    // Messaggi informativi sulla soglia
    if (complessivo < FISCALE.SOGLIA_BONUS_PIENO) {
        let residuo = FISCALE.SOGLIA_BONUS_PIENO - complessivo;
        info.style.display = "block";

        if (residuo <= FISCALE.SOGLIA_AVVISO_VICINO) {
            info.className = "alert alert-warning";
            info.innerHTML = `⚠️ <b>Attenzione!</b> Sei molto vicino alla soglia dei ${FISCALE.SOGLIA_BONUS_PIENO.toLocaleString()}€. Ti mancano solo <b>${residuo.toLocaleString()} €</b>.`;
        } else {
            info.className = "alert alert-info";
            info.innerHTML = `💡 Puoi percepire altri <b>${residuo.toLocaleString()} €</b> prima di superare la soglia dei ${FISCALE.SOGLIA_BONUS_PIENO.toLocaleString()}€ (per il Bonus Pieno).`;
        }
    } else if (complessivo < FISCALE.SOGLIA_BONUS_MAX) {
        let residuo = FISCALE.SOGLIA_BONUS_MAX - complessivo;
        info.style.display = "block";
        info.className = "alert alert-info";
        info.innerHTML = `💡 Puoi percepire altri <b>${residuo.toLocaleString()} €</b> prima di superare la soglia dei ${FISCALE.SOGLIA_BONUS_MAX.toLocaleString()}€.`;
    }

    // 1. Calcolo IRPEF
    let irpef = (complessivo <= FISCALE.SOGLIA_IRPEF_ALTA)
        ? (complessivo * FISCALE.ALIQUOTA_IRPEF_BASSA)
        : (FISCALE.SOGLIA_IRPEF_ALTA * FISCALE.ALIQUOTA_IRPEF_BASSA + (complessivo - FISCALE.SOGLIA_IRPEF_ALTA) * FISCALE.ALIQUOTA_IRPEF_ALTA);

    // 2. Detrazione Lavoro Dipendente
    let detLavoro = 0;
    if (ral > 0) {
        if (complessivo <= FISCALE.SOGLIA_BONUS_PIENO) {
            detLavoro = FISCALE.DETRAZIONE_LAVORO_BASE;
        } else if (complessivo <= FISCALE.SOGLIA_BONUS_MAX) {
            detLavoro = FISCALE.DETRAZIONE_LAVORO_RIDOTTA + FISCALE.DETRAZIONE_LAVORO_EXTRA * ((FISCALE.SOGLIA_BONUS_MAX - complessivo) / FISCALE.DETRAZIONE_LAVORO_RANGE);
        }
    }

    // 3. Detrazione Figli a Carico
    let detFigli = 0;
    if (figli > 0) {
        detFigli = (figli * FISCALE.DETRAZIONE_FIGLI_PER_FIGLIO) * ((FISCALE.SOGLIA_FIGLI - complessivo) / FISCALE.SOGLIA_FIGLI);
        if (detFigli < 0) detFigli = 0;
    }

    // 4. Detrazione Spese (Sanità + Trasporti)
    let detSpese = Math.max(0, (sanita - FISCALE.DETRAZIONE_SANITA_FRANCHIGIA) * FISCALE.ALIQUOTA_DETRAZIONE)
        + (Math.min(trasporti, FISCALE.DETRAZIONE_TRASPORTI_MAX) * FISCALE.ALIQUOTA_DETRAZIONE);

    // 5. Detrazione Affitto
    let detAffitto = 0;
    if (affittoValore === 'giovani') {
        if (complessivo <= FISCALE.SOGLIA_AFFITTO_GIOVANI) {
            let detGiovani = canoneAnnuo * FISCALE.ALIQUOTA_AFFITTO_GIOVANI;
            detAffitto = Math.max(FISCALE.DETRAZIONE_AFFITTO_GIOVANI_MIN, Math.min(FISCALE.DETRAZIONE_AFFITTO_GIOVANI_MAX, detGiovani));
            if (canoneAnnuo === 0) detAffitto = 0;
        }
    } else {
        let importoFisso = parseFloat(affittoValore) || 0;
        if (complessivo <= FISCALE.SOGLIA_AFFITTO_PIENO) {
            detAffitto = importoFisso;
        } else if (complessivo <= FISCALE.SOGLIA_AFFITTO_RIDOTTO) {
            detAffitto = importoFisso * 0.5;
        }
    }

    // 6. Altre Detrazioni (Mutuo + Edilizia)
    let detMutuo = Math.min(mutuo, FISCALE.DETRAZIONE_MUTUO_MAX) * FISCALE.ALIQUOTA_DETRAZIONE;
    let detAltre = detMutuo + edilizia;

    let detTotali = detLavoro + detFigli + detSpese + detAffitto + detAltre;

    // 7. Calcolo Bonus
    let bonus = 0;
    let bText = "Non Spettante";
    let bColor = IMPOSTAZIONI.COLORE_BONUS_NO;

    if (complessivo > FISCALE.SOGLIA_BONUS_MAX) {
        danger.style.display = "block";
        danger.innerHTML = `🚨 <b>Soglia Superata!</b> Reddito oltre i ${FISCALE.SOGLIA_BONUS_MAX.toLocaleString()}€. Il bonus non spetta.`;
        bText = "Soglia Superata";
    } else if (complessivo <= FISCALE.SOGLIA_BONUS_PIENO) {
        if (irpef > detLavoro) {
            bonus = FISCALE.BONUS_MASSIMO;
            bText = "Bonus Pieno";
            bColor = IMPOSTAZIONI.COLORE_BONUS_OK;
        } else {
            bText = "Incapiente";
            bColor = IMPOSTAZIONI.COLORE_BONUS_PARZIALE;
        }
    } else {
        let diff = detTotali - irpef;
        bonus = Math.min(FISCALE.BONUS_MASSIMO, Math.max(0, diff));
        if (bonus > 0) {
            bText = "Bonus Parziale";
            bColor = IMPOSTAZIONI.COLORE_BONUS_OK;
        } else {
            bText = "Nessun Bonus";
            bColor = IMPOSTAZIONI.COLORE_BONUS_PARZIALE;
            gap.style.display = "block";
            gap.innerHTML = `⚠️ <b>Ti mancano ${Math.round(irpef - detTotali)}€</b> di detrazioni per sbloccarlo.`;
        }
    }

    // Aggiorna i numeri nella pagina (con animazione)
    animateCounter('out-totale', complessivo);
    animateCounter('out-irpef', irpef);
    animateCounter('out-det-lavoro', detLavoro);

    const detFamigliaCasa = detFigli + detSpese + detAffitto + detAltre;
    animateCounter('out-det-famiglia-casa', detFamigliaCasa);

    animateCounter('out-det-figli', detFigli);
    animateCounter('out-det-spese', detSpese);
    animateCounter('out-det-affitto', detAffitto);
    animateCounter('out-det-altre', detAltre);
    animateCounter('out-bonus', bonus);

    const badge = document.getElementById('badge');
    badge.innerText = bText;
    badge.style.background = bColor;
}


// ── Avvio (si attiva quando la pagina è pronta) ──

document.addEventListener('DOMContentLoaded', () => {
    // Carica dati salvati dalla sessione precedente
    loadFormData();

    // Interruttore Essenziale/Completo
    document.getElementById('mode-toggle').addEventListener('change', () => {
        toggleMode();
        saveFormData();
    });

    // Ascolto su tutti i campi numerici
    const inputIds = ['ral', 'altri', 'figli', 'sanita', 'trasporti', 'canone', 'mutuo', 'edilizia'];
    inputIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            // Blocca caratteri non validi (e, +, -)
            element.addEventListener('keydown', (e) => {
                if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                    e.preventDefault();
                }
            });

            element.addEventListener('input', () => {
                element.value = element.value.replace(/[eE+\-]/g, '');
                calcola();
                debouncedSave();
            });
        }
    });

    // Menu a tendina affitto
    document.getElementById('affitto').addEventListener('change', () => {
        calcola();
        saveFormData();
    });

    // Pulsante reset
    document.getElementById('reset-btn').addEventListener('click', clearSavedData);

    // Primo calcolo
    toggleMode();
});
