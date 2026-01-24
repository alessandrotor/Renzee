// Tax calculation constants
const CONSTANTS = {
    // Income thresholds
    SOGLIA_BONUS_PIENO: 15000,
    SOGLIA_BONUS_MAX: 28000,
    SOGLIA_IRPEF_ALTA: 28000,
    SOGLIA_AFFITTO_GIOVANI: 15493.71,
    SOGLIA_AFFITTO_PIENO: 15493,
    SOGLIA_AFFITTO_RIDOTTO: 30987,
    SOGLIA_FIGLI: 95000,
    SOGLIA_AVVISO_VICINO: 1000,
    
    // Tax rates
    ALIQUOTA_IRPEF_BASSA: 0.23,
    ALIQUOTA_IRPEF_ALTA: 0.35,
    ALIQUOTA_DETRAZIONE: 0.19,
    ALIQUOTA_AFFITTO_GIOVANI: 0.20,
    
    // Deduction amounts
    DETRAZIONE_LAVORO_BASE: 1955,
    DETRAZIONE_LAVORO_RIDOTTA: 1910,
    DETRAZIONE_LAVORO_EXTRA: 1190,
    DETRAZIONE_LAVORO_RANGE: 13000,
    DETRAZIONE_FIGLI_PER_FIGLIO: 950,
    DETRAZIONE_SANITA_FRANCHIGIA: 129.11,
    DETRAZIONE_TRASPORTI_MAX: 250,
    DETRAZIONE_MUTUO_MAX: 4000,
    DETRAZIONE_AFFITTO_GIOVANI_MIN: 991.60,
    DETRAZIONE_AFFITTO_GIOVANI_MAX: 2000,
    
    // Bonus
    BONUS_MASSIMO: 1200,
    
    // Colors
    COLOR_SLATE: '#64748b',
    COLOR_GREEN: '#10b981',
    COLOR_ORANGE: '#f59e0b',
    COLOR_RED: '#ef4444'
};

function toggleMode() {
    const isFull = document.getElementById('mode-toggle').checked;
    const box = document.getElementById('main-box');

    if (isFull) {
        box.classList.add('mode-full');
        document.querySelectorAll('.ess-only').forEach(el => el.style.display = 'none');
    } else {
        box.classList.remove('mode-full');
        document.querySelectorAll('.ess-only').forEach(el => el.style.display = 'flex');
    }
    calcola();
}

function calcola() {
    // Clear all invalid states first
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.classList.remove('invalid');
    });

    const val = (id) => {
        const element = document.getElementById(id);
        const value = parseFloat(element.value) || 0;
        
        // Mark as invalid if negative
        if (element.value && value < 0) {
            element.classList.add('invalid');
        }
        
        return Math.max(0, value);
    };

    const ral = val('ral');
    const altri = val('altri');
    const complessivo = ral + altri;

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
        document.getElementById('badge').style.background = CONSTANTS.COLOR_SLATE;
        document.getElementById('badge').innerText = "In attesa dati";
        return;
    }

    // Show remaining capacity
    if (complessivo < CONSTANTS.SOGLIA_BONUS_PIENO) {
        let residuo = CONSTANTS.SOGLIA_BONUS_PIENO - complessivo;
        info.style.display = "block";

        if (residuo <= CONSTANTS.SOGLIA_AVVISO_VICINO) {
            info.className = "alert alert-warning";
            info.innerHTML = `⚠️ <b>Attenzione!</b> Sei molto vicino alla soglia dei ${CONSTANTS.SOGLIA_BONUS_PIENO.toLocaleString()}€. Ti mancano solo <b>${residuo.toLocaleString()} €</b>.`;
        } else {
            info.className = "alert alert-info";
            info.innerHTML = `💡 Puoi percepire altri <b>${residuo.toLocaleString()} €</b> prima di superare la soglia dei ${CONSTANTS.SOGLIA_BONUS_PIENO.toLocaleString()}€ (per il Bonus Pieno).`;
        }
    } else if (complessivo < CONSTANTS.SOGLIA_BONUS_MAX) {
        let residuo = CONSTANTS.SOGLIA_BONUS_MAX - complessivo;
        info.style.display = "block";
        info.className = "alert alert-info";
        info.innerHTML = `💡 Puoi percepire altri <b>${residuo.toLocaleString()} €</b> prima di superare la soglia dei ${CONSTANTS.SOGLIA_BONUS_MAX.toLocaleString()}€.`;
    }

    // 1. IRPEF
    let irpef = (complessivo <= CONSTANTS.SOGLIA_IRPEF_ALTA) 
        ? (complessivo * CONSTANTS.ALIQUOTA_IRPEF_BASSA) 
        : (CONSTANTS.SOGLIA_IRPEF_ALTA * CONSTANTS.ALIQUOTA_IRPEF_BASSA + (complessivo - CONSTANTS.SOGLIA_IRPEF_ALTA) * CONSTANTS.ALIQUOTA_IRPEF_ALTA);

    // 2. Detrazione Lavoro
    let detLavoro = 0;
    if (ral > 0) {
        if (complessivo <= CONSTANTS.SOGLIA_BONUS_PIENO) {
            detLavoro = CONSTANTS.DETRAZIONE_LAVORO_BASE;
        } else if (complessivo <= CONSTANTS.SOGLIA_BONUS_MAX) {
            detLavoro = CONSTANTS.DETRAZIONE_LAVORO_RIDOTTA + CONSTANTS.DETRAZIONE_LAVORO_EXTRA * ((CONSTANTS.SOGLIA_BONUS_MAX - complessivo) / CONSTANTS.DETRAZIONE_LAVORO_RANGE);
        }
    }

    // 3. Detrazione Figli
    let detFigli = 0;
    if (figli > 0) {
        detFigli = (figli * CONSTANTS.DETRAZIONE_FIGLI_PER_FIGLIO) * ((CONSTANTS.SOGLIA_FIGLI - complessivo) / CONSTANTS.SOGLIA_FIGLI);
        if (detFigli < 0) detFigli = 0;
    }

    // 4. Detrazione Spese
    let detSpese = Math.max(0, (sanita - CONSTANTS.DETRAZIONE_SANITA_FRANCHIGIA) * CONSTANTS.ALIQUOTA_DETRAZIONE) 
        + (Math.min(trasporti, CONSTANTS.DETRAZIONE_TRASPORTI_MAX) * CONSTANTS.ALIQUOTA_DETRAZIONE);

    // 5. Affitto
    let detAffitto = 0;
    if (affittoValore === 'giovani') {
        if (complessivo <= CONSTANTS.SOGLIA_AFFITTO_GIOVANI) {
            let detGiovani = canoneAnnuo * CONSTANTS.ALIQUOTA_AFFITTO_GIOVANI;
            detAffitto = Math.max(CONSTANTS.DETRAZIONE_AFFITTO_GIOVANI_MIN, Math.min(CONSTANTS.DETRAZIONE_AFFITTO_GIOVANI_MAX, detGiovani));
            if (canoneAnnuo === 0) detAffitto = 0;
        }
    } else {
        let importoFisso = parseFloat(affittoValore) || 0;
        if (complessivo <= CONSTANTS.SOGLIA_AFFITTO_PIENO) {
            detAffitto = importoFisso;
        } else if (complessivo <= CONSTANTS.SOGLIA_AFFITTO_RIDOTTO) {
            detAffitto = importoFisso * 0.5;
        }
    }

    // 6. Altre
    let detMutuo = Math.min(mutuo, CONSTANTS.DETRAZIONE_MUTUO_MAX) * CONSTANTS.ALIQUOTA_DETRAZIONE;
    let detAltre = detMutuo + edilizia;

    let detTotali = detLavoro + detFigli + detSpese + detAffitto + detAltre;

    // 7. Bonus
    let bonus = 0;
    let bText = "Non Spettante";
    let bColor = CONSTANTS.COLOR_RED;

    if (complessivo > CONSTANTS.SOGLIA_BONUS_MAX) {
        danger.style.display = "block";
        danger.innerHTML = `🚨 <b>Soglia Superata!</b> Reddito oltre i ${CONSTANTS.SOGLIA_BONUS_MAX.toLocaleString()}€. Il bonus non spetta.`;
        bText = "Soglia Superata";
    } else if (complessivo <= CONSTANTS.SOGLIA_BONUS_PIENO) {
        if (irpef > detLavoro) {
            bonus = CONSTANTS.BONUS_MASSIMO;
            bText = "Bonus Pieno";
            bColor = CONSTANTS.COLOR_GREEN;
        } else {
            bText = "Incapiente";
            bColor = CONSTANTS.COLOR_ORANGE;
        }
    } else {
        let diff = detTotali - irpef;
        bonus = Math.min(CONSTANTS.BONUS_MASSIMO, Math.max(0, diff));
        if (bonus > 0) {
            bText = "Bonus Parziale";
            bColor = CONSTANTS.COLOR_GREEN;
        } else {
            bText = "Nessun Bonus";
            bColor = CONSTANTS.COLOR_ORANGE;
            gap.style.display = "block";
            gap.innerHTML = `⚠️ <b>Ti mancano ${Math.round(irpef - detTotali)}€</b> di detrazioni per sbloccarlo.`;
        }
    }

    // Output UI
    const fmt = (n) => Math.round(n).toLocaleString() + " €";

    document.getElementById('out-totale').innerText = complessivo.toLocaleString() + " €";
    document.getElementById('out-irpef').innerText = fmt(irpef);
    document.getElementById('out-det-lavoro').innerText = fmt(detLavoro);

    // Essential Mode Aggregate
    let detFamigliaCasa = detFigli + detSpese + detAffitto + detAltre;
    document.getElementById('out-det-famiglia-casa').innerText = fmt(detFamigliaCasa);

    // Full Mode Details
    document.getElementById('out-det-figli').innerText = fmt(detFigli);
    document.getElementById('out-det-spese').innerText = fmt(detSpese);
    document.getElementById('out-det-affitto').innerText = fmt(detAffitto);
    document.getElementById('out-det-altre').innerText = fmt(detAltre);

    document.getElementById('out-bonus').innerText = fmt(bonus);

    const badge = document.getElementById('badge');
    badge.innerText = bText;
    badge.style.background = bColor;
}

// Event listeners setup
document.addEventListener('DOMContentLoaded', () => {
    // Mode toggle
    document.getElementById('mode-toggle').addEventListener('change', toggleMode);
    
    // Input listeners
    const inputIds = ['ral', 'altri', 'figli', 'sanita', 'trasporti', 'canone', 'mutuo', 'edilizia'];
    inputIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', calcola);
        }
    });
    
    // Select listener
    document.getElementById('affitto').addEventListener('change', calcola);
    
    // Initialize
    toggleMode();
});
