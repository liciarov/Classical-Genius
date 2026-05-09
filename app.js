const SUPABASE_URL = 'https://nbiyrabvjljkdmuqdtoc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iaXlyYWJ2amxqa2RtdXFkdG9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyODQzNzEsImV4cCI6MjA5Mzg2MDM3MX0.esTmKlAtrQpl2Sj9tlF3AeQB8HCFMeJO-3vLjPyNX5o';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

async function caricaFiltri() {

    // Periodi
    const { data: periodi, error: e1 } = await db
        .from('Periodi')
        .select('IDPeriodo, Periodo')
        .order('IDPeriodo');
    console.log('Periodi:', periodi, e1);
    const selPeriodo = document.getElementById('sel-periodo');
    if (periodi) periodi.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.IDPeriodo;
        opt.textContent = p.Periodo;
        selPeriodo.appendChild(opt);
    });

    // Nazioni
    const { data: nazioni, error: e2 } = await db
        .from('Nazioni')
        .select('IDNazione, Nazione')
        .order('Nazione');
    console.log('Nazioni:', nazioni, e2);
    const selNazione = document.getElementById('sel-nazione');
    if (nazioni) nazioni.forEach(n => {
        const opt = document.createElement('option');
        opt.value = n.IDNazione;
        opt.textContent = n.Nazione;
        selNazione.appendChild(opt);
    });

    // Compositori
    const { data: compositori, error: e3 } = await db
        .from('Compositori')
        .select('IDCompositore, "Nome Compositore"')
        .order('"Nome Compositore"');
    console.log('Compositori:', compositori, e3);
    const selCompositore = document.getElementById('sel-compositore');
    if (compositori) compositori.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.IDCompositore;
        opt.textContent = c['Nome Compositore'];
        selCompositore.appendChild(opt);
    });

    // Forme musicali
    const { data: forme, error: e4 } = await db
        .from('Forma Musicale')
        .select('IDFormaMusicale, FormaMusicale')
        .order('FormaMusicale');
    console.log('Forme:', forme, e4);
    const selForma = document.getElementById('sel-forma');
    if (forme) forme.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.IDFormaMusicale;
        opt.textContent = f.FormaMusicale;
        selForma.appendChild(opt);
    });
}

document.getElementById('btn-gioca').addEventListener('click', () => {
    alert('Presto qui inizierà il gioco! 🎵');
});

caricaFiltri();
