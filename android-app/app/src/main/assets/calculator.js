// LocalStorage functions
function saveFormData() {
    console.log('💾 Salvataggio dati in corso...');
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
        console.log('✅ Dati salvati:', formData);
    } catch (e) {
        console.error('❌ Errore salvataggio dati:', e);
    }
}

function loadFormData() {
    const saved = localStorage.getItem('bonusSimulatorData');
    if (!saved) {
        console.log('ℹ️ Nessun dato salvato trovato.');
        return false;
    }
    try {
        const formData = JSON.parse(saved);
        console.log('🔄 Dati trovati in localStorage:', formData);
        // Restore input values
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
        console.log('✅ Dati ripristinati nel form');
        return true;
    } catch (e) {
        console.error('❌ Errore caricamento dati salvati:', e);
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

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    loadFormData();
    document.getElementById('mode-toggle').addEventListener('change', () => {
        toggleMode();
        saveFormData();
    });
    const inputIds = ['ral', 'altri', 'figli', 'sanita', 'trasporti', 'canone', 'mutuo', 'edilizia'];
    inputIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                calcola();
                debouncedSave();
            });
        }
    });
    document.getElementById('affitto').addEventListener('change', () => {
        calcola();
        saveFormData();
    });
    document.getElementById('reset-btn').addEventListener('click', clearSavedData);
    window.addEventListener('beforeunload', saveFormData);
    toggleMode();
});
