const SUPABASE_URL = 'https://nbiyrabvjljkdmuqdtoc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DnXa5fmy-Q7z2RBLXtFMNQ_eRYqglS8';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

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
    const { data: compositori, error: errComp } = await db
        .from('
