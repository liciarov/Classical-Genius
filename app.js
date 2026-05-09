// Connessione a Supabase
const SUPABASE_URL = 'https://nbiyrabvjljkdmuqdtoc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DnXa5fmy-Q7z2RBLXtFMNQ_eRYqglS8';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// Carica i menu a tendina all'avvio
async function caricaFiltri() {
    // Periodi
    const { data: periodi } = await db
        .from('Periodi')
        .select('IDPeriodo, Periodo')
        .order('IDPeriodo');
    
    const selPeriodo = document.getElementById('sel-periodo');
    periodi.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.IDPeriodo;
        opt.textContent = p.Periodo;
        selPeriodo.appendChild(opt);
    });

    // Nazioni
    const { data: nazioni } = await db
        .from('Nazioni')
        .select('IDNazione, Nazione')
        .order('Nazione');
    
    const selNazione = document.getElementById('sel-nazione');
    nazioni.forEach(n => {
        const opt = document.createElement('option');
        opt.value = n.IDNazione;
        opt.textContent = n.Nazione;
        selNazione.appendChild(opt);
    });

    // Compositori
    const { data: compositori } = await db
        .from('Compositori')
        .select('IDCompositore, NomeCompositore')
        .order('NomeCompositore');
    
    const selCompositore = document.getElementById('sel-compositore');
    compositori.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.IDCompositore;
        opt.textContent = c.NomeCompositore;
        selCompositore.appendChild(opt);
    });

    // Forme musicali
    const { data: forme } = await db
        .from('Forma Musicale')
        .select('IDFormaMusicale, FormaMusicale')
        .order('FormaMusicale');
    
    const selForma = document.getElementById('sel-forma');
    forme.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.IDFormaMusicale;
        opt.textContent = f.FormaMusicale;
        selForma.appendChild(opt);
    });
}

// Bottone gioca
document.getElementById('btn-gioca').addEventListener('click', () => {
    alert('Presto qui inizierà il gioco! 🎵');
});

// Avvia
caricaFiltri();
