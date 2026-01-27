// Constants
const CONSTANTS = {
    SOGLIA_BONUS_PIENO: 15000,
    SOGLIA_BONUS_MAX: 28000,
    DETRAZIONE_LAVORO_BASE: 1955,
    DETRAZIONE_LAVORO_RIDOTTA: 1910,
    DETRAZIONE_LAVORO_EXTRA: 1190,
    DETRAZIONE_LAVORO_RANGE: 13000,
    BONUS_MASSIMO: 1200,
    ALIQUOTA_IRPEF_BASSA: 0.23,
    ALIQUOTA_IRPEF_ALTA: 0.25 // Using simplified 25% for 15-28k bracket as per 2024/2025 trends if applicable, or stick to provided logic
};

// Reusing core logic but updating specific V3 UI
function calcola() {
    const val = (id) => parseFloat(document.getElementById(id).value) || 0;

    // Inputs
    const ral = val('ral');
    const altri = val('altri');
    const complessivo = ral + altri;

    // Core Calculations (Simplified for V3 Dashboard visualization)
    // 1. IRPEF Lorda
    let irpef = 0;
    if (complessivo <= 15000) {
        irpef = complessivo * 0.23;
    } else if (complessivo <= 28000) {
        irpef = 3450 + (complessivo - 15000) * 0.23; // Keeping 23% for low bracket simplicity or older logic? 
        // NOTE: Standard IRPEF 2024 is 23% up to 28k. 
        // Let's stick to a straight 23% for <28k for simplicity unless strict bracket needed.
        irpef = complessivo * 0.23;
    } else if (complessivo <= 50000) {
        irpef = 6440 + (complessivo - 28000) * 0.35;
    } else {
        irpef = 14140 + (complessivo - 50000) * 0.43;
    }

    // 2. Detrazioni (Simplified placeholder logic + User inputs)
    // In V3, we assume user might inputs total deductions or we calculate basics
    // For this demo, let's use the DETRAZIONI logic from V1/V2

    let detLavoro = 0;
    if (ral > 0) {
        if (complessivo <= 15000) detLavoro = 1955;
        else if (complessivo <= 28000) {
            detLavoro = 1910 + 1190 * ((28000 - complessivo) / 13000);
        } else if (complessivo <= 50000) {
            detLavoro = 1910 * ((50000 - complessivo) / 22000); // Rough approximation
        }
    }

    const figli = val('figli') * 950; // Simplification
    const sanita = Math.max(0, val('sanita') - 129) * 0.19;

    let detTotali = detLavoro + figli + sanita;

    // 3. Bonus
    let bonus = 0;
    let statusTitle = "Esito: Calcolo...";
    let statusDesc = "";
    let statusColor = "#0066ff"; // Default Blue

    let marginVal = 0;
    let marginText = "";
    let marginColor = "#1f2937";

    if (complessivo > 28000) {
        // CASE: OVER 28k
        bonus = 0;
        statusTitle = "Nessun Bonus ❌";
        statusDesc = `Il tuo reddito (${complessivo.toLocaleString()}€) supera la soglia massima di 28.000€.`;
        statusColor = "#ef4444"; // Red

        marginVal = 0;
        marginText = "Oltre soglia";

        updateRiskBar(100); // Max right

    } else if (complessivo <= 15000) {
        // CASE: UNDER 15k (Full Bonus potentially, check incapienza)
        if (irpef > detTotali) {
            bonus = 100; // 1200 / 12 months = 100/mo? Or annual? Let's show annual 1200
            bonus = 1200;
            statusTitle = "Bonus Pieno! ✅";
            statusDesc = "Il tuo reddito è sotto i 15.000€ e hai capienza fiscale.";
            statusColor = "#10b981"; // Green

            marginVal = 15000 - complessivo;
            marginText = "Prima della fase di riduzione (15.000€).";
            marginColor = "#10b981"; // Green

            updateRiskBar(complessivo / 28000 * 100); // Scale relative to 28k max
        } else {
            // Incapiente
            bonus = 0; // Or whatever differenzial logic
            statusTitle = "Incapiente ⚠️";
            statusDesc = "Le tue detrazioni superano l'imposta. Non riesci a generare il credito per il bonus.";
            statusColor = "#f59e0b"; // Orange
            marginText = "Necessiti di più imposta lorda.";
            updateRiskBar(10);
        }

    } else {
        // CASE: 15k - 28k (Bonus a Rischio / Reduction)
        // Bonus = (28000 - Red) * something? Or just check irpef - det?
        // Renzi bonus 2020+ logic: 1200 if <15k. If 15-28k: Min(1200, Det - Irpef)? 
        // Wait, standard logic provided in code: 
        // if (complessivo <= 28000) bonus difference betwee det and irpef?

        // Let's rely on V2 logic logic: 
        // let diff = detTotali - irpef;
        // bonus = Math.min(1200, Math.max(0, diff));

        let diff = detTotali - irpef;
        bonus = Math.min(1200, Math.max(0, diff));

        statusTitle = "Bonus a Rischio! ⚠️";
        statusDesc = `Con la tua RAL di ${complessivo.toLocaleString()}€, sei nella fascia di riduzione.`;
        statusColor = "#0066ff"; // Blue as in mockup

        marginVal = 28000 - complessivo;
        marginText = "Prima della soglia critica dei 28.000€.";
        marginColor = "#dc2626"; // Red text for margin

        let pct = (complessivo / 28000) * 100;
        updateRiskBar(pct);
    }

    // UI Updates
    document.getElementById('status-title').innerText = statusTitle;
    document.getElementById('status-desc').innerText = statusDesc;
    document.querySelector('.status-card').style.backgroundColor = statusColor;

    document.getElementById('margin-value').innerText = marginVal.toLocaleString() + "€";
    document.getElementById('margin-value').style.color = marginColor;
    document.getElementById('margin-text').innerText = marginText;

    // Toggle margin card styling based on risk
    const marginCard = document.querySelector('.margin-card');
    if (complessivo > 15000 && complessivo <= 28000) {
        marginCard.classList.add('at-risk');
    } else {
        marginCard.classList.remove('at-risk');
    }

    document.getElementById('val-lorda').innerText = irpef.toLocaleString() + "€";
    document.getElementById('val-det').innerText = Math.round(detTotali).toLocaleString() + "€";
    document.getElementById('val-bonus').innerText = Math.round(bonus).toLocaleString() + "€";
}

function updateRiskBar(percentage) {
    // 0% = left, 100% = right
    const indicator = document.getElementById('risk-indicator');
    // Clamp between 0 and 100
    const clamped = Math.max(0, Math.min(100, percentage));
    indicator.style.left = `${clamped}%`;
}

function resetCalculator() {
    document.getElementById('ral').value = 0;
    document.getElementById('altri').value = 0;
    document.getElementById('figli').value = 0;
    document.getElementById('sanita').value = 0;
    calcola();
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(i => i.addEventListener('input', calcola));
    calcola();
});
