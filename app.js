const SUPABASE_URL = 'https://nbiyrabvjljkdmuqdtoc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iaXlyYWJ2amxqa2RtdXFkdG9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyODQzNzEsImV4cCI6MjA5Mzg2MDM3MX0.esTmKlAtrQpl2Sj9tlF3AeQB8HCFMeJO-3vLjPyNX5o';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

let braniDisponibili = [];
let branoCorrente = null;
let durataScelta = 5;
let audioContext = null;
let playerAttivo = null;

// SCHERMATE
function mostraHome() {
    document.getElementById('schermata-home').style.display = 'block';
    document.getElementById('schermata-gioco').style.display = 'none';
}

function mostraGioco() {
    document.getElementById('schermata-home').style.display = 'none';
    document.getElementById('schermata-gioco').style.display = 'block';
}

// CARICA FILTRI
async function caricaFiltri() {
    const { data: periodi } = await db.from('Periodi').select('IDPeriodo, Periodo').order('IDPeriodo');
    const selPeriodo = document.getElementById('sel-periodo');
    periodi.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.IDPeriodo;
        opt.textContent = p.Periodo;
        selPeriodo.appendChild(opt);
    });

    const { data: nazioni } = await db.from('Nazioni').select('IDNazione, Nazione').order('Nazione');
    const selNazione = document.getElementById('sel-nazione');
    nazioni.forEach(n => {
        const opt = document.createElement('option');
        opt.value = n.IDNazione;
        opt.textContent = n.Nazione;
        selNazione.appendChild(opt);
    });

    const { data: compositori } = await db.from('Compositori').select('IDCompositore, "Nome Compositore"').order('"Nome Compositore"');
    const selCompositore = document.getElementById('sel-compositore');
    if (compositori) compositori.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.IDCompositore;
        opt.textContent = c['Nome Compositore'];
        selCompositore.appendChild(opt);
    });

    const { data: forme } = await db.from('Forma Musicale').select('IDFormaMusicale, FormaMusicale').order('FormaMusicale');
    const selForma = document.getElementById('sel-forma');
    if (forme) forme.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.IDFormaMusicale;
        opt.textContent = f.FormaMusicale;
        selForma.appendChild(opt);
    });
}

// CARICA BRANI filtrati
async function caricaBrani() {
    const periodo = document.getElementById('sel-periodo').value;
    const nazione = document.getElementById('sel-nazione').value;
    const compositore = document.getElementById('sel-compositore').value;
    const forma = document.getElementById('sel-forma').value;
    durataScelta = parseFloat(document.getElementById('sel-durata').value);

    let query = db.from('Brani').select(`
        IDBrano, Codice, Titolo, Movimento, NumeroSpezzoni,
        Compositori!inner("Nome Compositore", IDNazione, IDPeriodo),
        "Forma Musicale"!inner(FormaMusicale)
    `);

    if (compositore) query = query.eq('IDCompositore', compositore);
    if (forma) query = query.eq('IDFormaMusicale', forma);
    if (nazione) query = query.eq('Compositori.IDNazione', nazione);
    if (periodo) query = query.eq('Compositori.IDPeriodo', periodo);

    const { data, error } = await query;
    console.log('Brani:', data, error);

    if (!data || data.length === 0) {
        alert('Nessun brano trovato con questi filtri!');
        return false;
    }

    braniDisponibili = data.sort(() => Math.random() - 0.5);
    return true;
}

// PROSSIMO BRANO
async function prossimoBrano() {
    if (braniDisponibili.length === 0) {
        alert('Hai ascoltato tutti i brani! Ricomincia.');
        mostraHome();
        return;
    }

    branoCorrente = braniDisponibili.pop();
    document.getElementById('risposta').style.display = 'none';
    document.getElementById('btn-mostra-risposta').style.display = 'block';
    document.getElementById('info-brano').textContent = '🎵 Premi play per ascoltare';
    document.getElementById('durata-scelta').textContent = durataScelta + ' sec';
}

// PLAYER MIDI
async function ascoltaSpezzone() {
    if (!branoCorrente) return;

    const numSpezzoni = branoCorrente.NumeroSpezzoni || 100;
    const spezzoneNum = Math.floor(Math.random() * numSpezzoni) + 1;
    const nomeFile = `${branoCorrente.Codice}_${String(spezzoneNum).padStart(3, '0')}.mid`;
    const url = `${SUPABASE_URL}/storage/v1/object/public/Spezzoni/${nomeFile}`;

    document.getElementById('info-brano').textContent = '⏳ Caricamento...';

    try {
        const risposta = await fetch(url);
        const buffer = await risposta.arrayBuffer();

        if (!audioContext) audioContext = new AudioContext();

        Soundfont.instrument(audioContext, 'acoustic_grand_piano').then(piano => {
            if (playerAttivo) playerAttivo.stop();

            const player = new MidiPlayer.Player(event => {
                if (event.name === 'Note on' && event.velocity > 0) {
                    piano.play(event.noteName, audioContext.currentTime, {
                        gain: event.velocity / 100,
                        duration: 0.5
                    });
                }
            });

            player.loadArrayBuffer(buffer);
            player.play();
            playerAttivo = player;

            setTimeout(() => {
                player.stop();
                document.getElementById('info-brano').textContent = '🎵 Hai sentito lo spezzone — di chi è?';
            }, durataScelta * 1000);

            document.getElementById('info-brano').textContent = '🎵 In ascolto...';
        });
    } catch (e) {
        document.getElementById('info-brano').textContent = '❌ Errore caricamento spezzone';
        console.error(e);
    }
}

// MOSTRA RISPOSTA
function mostraRisposta() {
    if (!branoCorrente) return;
    const comp = branoCorrente.Compositori;
    document.getElementById('titolo-risposta').textContent = branoCorrente.Titolo;
    document.getElementById('compositore-risposta').textContent = comp ? comp['Nome Compositore'] : '';
    document.getElementById('movimento-risposta').textContent = branoCorrente.Movimento || '';
    document.getElementById('risposta').style.display = 'block';
    document.getElementById('btn-mostra-risposta').style.display = 'none';
}

// EVENTI
document.getElementById('btn-gioca').addEventListener('click', async () => {
    const ok = await caricaBrani();
    if (ok) {
        mostraGioco();
        prossimoBrano();
    }
});

document.getElementById('btn-home').addEventListener('click', mostraHome);
document.getElementById('btn-ascolta').addEventListener('click', ascoltaSpezzone);
document.getElementById('btn-mostra-risposta').addEventListener('click', mostraRisposta);

['btn-corretto', 'btn-insicuro', 'btn-sbagliato', 'btn-nonricordo'].forEach(id => {
    document.getElementById(id).addEventListener('click', prossimoBrano);
});

document.getElementById('btn-segnala').addEventListener('click', () => {
    const codice = branoCorrente ? branoCorrente.Codice : '?';
    const problema = prompt(`Segnala problema per ${codice}:\nDescrivi brevemente:`);
    if (problema) {
        db.from('Segnalazioni').insert({
            Codice: codice,
            Problema: problema,
            Data: new Date().toISOString()
        });
        alert('Grazie per la segnalazione!');
    }
});

// AVVIO
caricaFiltri();
