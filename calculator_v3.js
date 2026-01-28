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
    ALIQUOTA_IRPEF_ALTA: 0.25,
    ALIQUOTA_IRPEF_MEDIA: 0.35,
    ALIQUOTA_IRPEF_MAX: 0.43
};

// Utils
const formatCurrency = (amount) => {
    return Math.round(amount).toLocaleString('it-IT') + "€";
};

// 1. Input Handling
function getInputs() {
    const val = (id) => parseFloat(document.getElementById(id).value) || 0;
    const ral = val('ral');
    const altri = val('altri');
    return {
        ral,
        altri,
        figli: val('figli'),
        sanita: val('sanita'),
        complessivo: ral + altri
    };
}

// 2. Core Logic / Calculation
function calculateResults(inputs) {
    const { ral, complessivo, figli, sanita } = inputs;

    // A. IRPEF Lorda
    let irpef = 0;
    if (complessivo <= 15000) {
        irpef = complessivo * CONSTANTS.ALIQUOTA_IRPEF_BASSA;
    } else if (complessivo <= 28000) {
        irpef = 3450 + (complessivo - 15000) * CONSTANTS.ALIQUOTA_IRPEF_BASSA; // Simplified 23%
    } else if (complessivo <= 50000) {
        irpef = 6440 + (complessivo - 28000) * CONSTANTS.ALIQUOTA_IRPEF_MEDIA;
    } else {
        irpef = 14140 + (complessivo - 50000) * CONSTANTS.ALIQUOTA_IRPEF_MAX;
    }

    // B. Detrazioni
    let detLavoro = 0;
    if (ral > 0) {
        if (complessivo <= 15000) detLavoro = CONSTANTS.DETRAZIONE_LAVORO_BASE;
        else if (complessivo <= 28000) {
            detLavoro = CONSTANTS.DETRAZIONE_LAVORO_RIDOTTA + CONSTANTS.DETRAZIONE_LAVORO_EXTRA * ((28000 - complessivo) / CONSTANTS.DETRAZIONE_LAVORO_RANGE);
        } else if (complessivo <= 50000) {
            detLavoro = CONSTANTS.DETRAZIONE_LAVORO_RIDOTTA * ((50000 - complessivo) / 22000);
        }
    }

    const detFigli = figli * 950;
    const detSanita = Math.max(0, sanita - 129) * 0.19;
    const detTotali = detLavoro + detFigli + detSanita;

    // C. Bonus & Status
    let bonus = 0;
    let status = { title: "", desc: "", color: "" };
    let margin = { val: 0, text: "", color: "", header: "" };
    let riskPct = 0;

    if (complessivo > 28000) {
        // CASE: OVER 28k
        bonus = 0;
        status = {
            title: "Nessun Bonus ❌",
            desc: `Il tuo reddito (${formatCurrency(complessivo)}) supera la soglia massima di 28.000€.`,
            color: "#ef4444" // Red
        };
        margin = {
            val: 0,
            text: "Oltre soglia",
            color: "#1f2937",
            header: "Bonus Completamente Perso"
        };
        riskPct = 100;

    } else if (complessivo <= 15000) {
        // CASE: UNDER 15k
        if (irpef > detTotali) {
            bonus = 1200;
            status = {
                title: "Bonus Pieno! ✅",
                desc: "Il tuo reddito è sotto i 15.000€ e hai capienza fiscale.",
                color: "#10b981" // Green
            };
            margin = {
                val: 15000 - complessivo,
                text: "Prima della fase di riduzione (15.000€).",
                color: "#10b981", // Green
                header: "Nel 2026 puoi ancora guadagnare"
            };
            riskPct = (complessivo / 28000) * 100;
        } else {
            // Incapiente
            bonus = 0;
            status = {
                title: "Incapiente ⚠️",
                desc: "Le tue detrazioni superano l'imposta. Non riesci a generare il credito per il bonus.",
                color: "#f59e0b" // Orange
            };
            margin = {
                val: 0,
                text: "Necessiti di più imposta lorda.",
                color: "#1f2937",
                header: "Situazione Incapienza"
            };
            riskPct = 10;
        }

    } else {
        // CASE: 15k - 28k
        let diff = detTotali - irpef;
        bonus = Math.min(1200, Math.max(0, diff));

        status = {
            title: "Bonus a Rischio! ⚠️",
            desc: `Con la tua RAL di ${formatCurrency(complessivo)}, sei nella fascia di riduzione.`,
            color: "#0066ff" // Blue
        };
        margin = {
            val: 28000 - complessivo,
            text: "Prima della soglia critica dei 28.000€.",
            color: "#dc2626", // Red
            header: "Perdi il bonus se guadagni altri"
        };
        riskPct = (complessivo / 28000) * 100;
    }

    return { irpef, detTotali, bonus, status, margin, riskPct };
}

// 3. UI Updates
function updateUI(results) {
    // Status Card
    document.getElementById('status-title').innerText = results.status.title;
    document.getElementById('status-desc').innerText = results.status.desc;
    document.querySelector('.status-card').style.backgroundColor = results.status.color;

    // Margin Card
    const marginCard = document.querySelector('.margin-card');
    document.getElementById('margin-value').innerText = formatCurrency(results.margin.val);
    document.getElementById('margin-value').style.color = results.margin.color;
    document.getElementById('margin-text').innerText = results.margin.text;
    document.querySelector('.margin-card .card-header h4').innerText = results.margin.header;

    // Margin Risk Styling
    if (results.riskPct > 53 && results.riskPct < 100) { // Approx > 15k (15/28 = 53%)
        marginCard.classList.add('at-risk');
        marginCard.style.borderLeftColor = ""; // Use CSS class color
    } else {
        marginCard.classList.remove('at-risk');
        marginCard.style.borderLeftColor = ""; // Use CSS default
    }

    // Data Cards
    document.getElementById('val-lorda').innerText = formatCurrency(results.irpef);
    document.getElementById('val-det').innerText = formatCurrency(results.detTotali);
    document.getElementById('val-bonus').innerText = formatCurrency(results.bonus);
}

// 4. State Management
function showWelcomeState() {
    document.getElementById('status-title').innerText = "Benvenuto! 👋";
    document.getElementById('status-desc').innerText = "Inserisci i tuoi dati per vedere l'analisi del bonus 2026.";
    document.querySelector('.status-card').style.backgroundColor = "#0066ff";

    const marginCard = document.querySelector('.margin-card');
    document.getElementById('margin-value').innerText = "—";
    document.getElementById('margin-value').style.color = "#6b7280";
    document.getElementById('margin-text').innerText = "Compila il form per iniziare.";
    document.querySelector('.margin-card .card-header h4').innerText = "In Attesa di Dati";

    marginCard.classList.remove('at-risk');
    marginCard.style.borderLeftColor = ""; // Reset to default

    document.getElementById('val-lorda').innerText = "0€";
    document.getElementById('val-det').innerText = "0€";
    document.getElementById('val-bonus').innerText = "0€";
}

function processCalculation() {
    const inputs = getInputs();
    if (inputs.complessivo === 0) {
        showWelcomeState();
        return;
    }
    const results = calculateResults(inputs);
    updateUI(results);
}

function resetCalculator() {
    ['ral', 'altri', 'figli', 'sanita'].forEach(id => {
        document.getElementById(id).value = 0;
    });
    processCalculation();
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(i => i.addEventListener('input', processCalculation));
    processCalculation(); // Initial run
});

