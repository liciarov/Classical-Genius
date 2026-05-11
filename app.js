const SUPABASE_URL = 'https://nbiyrabvjljkdmuqdtoc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iaXlyYWJ2amxqa2RtdXFkdG9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyODQzNzEsImV4cCI6MjA5Mzg2MDM3MX0.esTmKlAtrQpl2Sj9tlF3AeQB8HCFMeJO-3vLjPyNX5o';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

let braniDisponibili = [];
let branoCorrente = null;
let durataScelta = 5;
let audioContext = null;
let playerAttivo = null;

function mostraHome() {
    document.getElementById('schermata-home').style.display = 'block';
    document.getElementById('schermata-gioco').style.display = 'none';
}

function mostraGioco() {
    document.getElementById('schermata-home').style.display = 'none';
    document.getElementById('schermata-gioco').style.display = 'block';
}

function svuotaSelect(id, placeholder) {
    const sel = document.getElementById(id);
    sel.innerHTML = `<option value="">${placeholder}</option>`;
}

async function caricaPeriodi() {
    const { data } = await db.from('Periodi').select('IDPeriodo, Periodo').order('IDPeriodo');
    const sel = document.getElementById('sel-periodo');
    if (data) data.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.IDPeriodo;
        opt.textContent = p.Periodo;
        sel.appendChild(opt);
    });
}

async function caricaNazioni(periodoId) {
    svuotaSelect('sel-nazione', '-- Tutte le nazioni --');
    svuotaSelect('sel-compositore', '-- Tutti i compositori --');
    svuotaSelect('sel-forma', '-- Tutte le forme --');

    let query = db.from('Compositori').select('IDNazione, Nazioni(IDNazione, Nazione)');
    if (periodoId) query = query.eq('IDPeriodo', periodoId);

    const { data } = await query;
    if (!data) return;

    const nazioniMap = {};
    data.forEach(c => {
        if (c.Nazioni) nazioniMap[c.Nazioni.IDNazione] = c.Nazioni.Nazione;
    });

    const sel = document.getElementById('sel-nazione');
    Object.entries(nazioniMap).sort((a,b) => a[1].localeCompare(b[1])).forEach(([id, nome]) => {
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = nome;
        sel.appendChild(opt);
    });
}

async function caricaCompositori(periodoId, nazioneId) {
    svuotaSelect('sel-compositore', '-- Tutti i compositori --');
    svuotaSelect('sel-forma', '-- Tutte le forme --');

    let query = db.from('Compositori').select('IDCompositore, "Nome Compositore"');
    if (periodoId) query = query.eq('IDPeriodo', periodoId);
    if (nazioneId) query = query.eq('IDNazione', nazioneId);
    query = query.order('"Nome Compositore"');

    const { data } = await query;
    const sel = document.getElementById('sel-compositore');
    if (data) data.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.IDCompositore;
        opt.textContent = c['Nome Compositore'];
        sel.appendChild(opt);
    });
}

async function caricaForme(periodoId, nazioneId, compositoreId) {
    svuotaSelect('sel-forma', '-- Tutte le forme --');

    let query = db.from('Brani').select(`
        IDFormaMusicale,
        "Forma Musicale"(IDFormaMusicale, FormaMusicale),
        Compositori!inner(IDPeriodo, IDNazione)
    `);

    if (compositoreId) query = query.eq('IDCompositore', compositoreId);
    else {
        if (periodoId) query = query.eq('Compositori.IDPeriodo', periodoId);
        if (nazioneId) query = query.eq('Compositori.IDNazione', nazioneId);
    }

    const { data } = await query;
    if (!data) return;

    const formeMap = {};
    data.forEach(b => {
        if (b['Forma Musicale']) {
            formeMap[b['Forma Musicale'].IDFormaMusicale] = b['Forma Musicale'].FormaMusicale;
        }
    });

    const sel = document.getElementById('sel-forma');
    Object.entries(formeMap).sort((a,b) => a[1].localeCompare(b[1])).forEach(([id, nome]) => {
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = nome;
        sel.appendChild(opt);
    });
}

async function caricaBrani() {
    const periodo = document.getElementById('sel-periodo').value;
    const nazione = document.getElementById('sel-nazione').value;
    const compositore = document.getElementById('sel-compositore').value;
    const forma = document.getElementById('sel-forma').value;
    durataScelta = parseFloat(document.getElementById('sel-durata').value);

    let query = db.from('Brani').select(`
        IDBrano, Codice, Titolo, Movimento, NumeroSpezzoni,
        Compositori("Nome Compositore", IDNazione, IDPeriodo),
        "Forma Musicale"(FormaMusicale)
    `);

    if (compositore) query = query.eq('IDCompositore', compositore);
    if (forma) query = query.eq('IDFormaMusicale', forma);

    const { data, error } = await query;
    console.log('Brani:', data, error);

    let filtrati = data || [];
    if (nazione) filtrati = filtrati.filter(b => b.Compositori?.IDNazione == nazione);
    if (periodo) filtrati = filtrati.filter(b => b.Compositori?.IDPeriodo == periodo);

    if (filtrati.length === 0) {
        alert('Nessun brano trovato con questi filtri!');
        return false;
    }

    braniDisponibili = filtrati.sort(() => Math.random() - 0.5);
    return true;
}

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
                document.getElementById('info-brano').textContent = '🎵 Di chi è questo brano?';
            }, durataScelta * 1000);

            document.getElementById('info-brano').textContent = '🎵 In ascolto...';
        });
    } catch (e) {
        document.getElementById('info-brano').textContent = '❌ Errore caricamento';
        console.error(e);
    }
}

function mostraRisposta() {
    if (!branoCorrente) return;
    const comp = branoCorrente.Compositori;
    document.getElementById('titolo-risposta').textContent = branoCorrente.Titolo;
    document.getElementById('compositore-risposta').textContent = comp ? comp['Nome Compositore'] : '';
    document.getElementById('movimento-risposta').textContent = branoCorrente.Movimento || '';
    document.getElementById('risposta').style.display = 'block';
    document.getElementById('btn-mostra-risposta').style.display = 'none';
}

document.getElementById('sel-periodo').addEventListener('change', function() {
    caricaNazioni(this.value);
    caricaCompositori(this.value, '');
    caricaForme(this.value, '', '');
});

document.getElementById('sel-nazione').addEventListener('change', function() {
    const periodo = document.getElementById('sel-periodo').value;
    caricaCompositori(periodo, this.value);
    caricaForme(periodo, this.value, '');
});

document.getElementById('sel-compositore').addEventListener('change', function() {
    const periodo = document.getElementById('sel-periodo').value;
    const nazione = document.getElementById('sel-nazione').value;
    caricaForme(periodo, nazione, this.value);
});

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

async function avvio() {
    await caricaPeriodi();

    const { data: nazioni, error: errNaz } = await db.from('Nazioni').select('IDNazione, Nazione').order('Nazione');
    console.log('Nazioni:', nazioni, errNaz);
    const selNazione = document.getElementById('sel-nazione');
    if (nazioni) nazioni.forEach(n => {
        const opt = document.createElement('option');
        opt.value = n.IDNazione;
        opt.textContent = n.Nazione;
        selNazione.appendChild(opt);
    });

    const { data: compositori } = await db.from('Compositori').select('IDCompositore, "Nome Compositore"').order('"Nome Compositore"');
    const selComp = document.getElementById('sel-compositore');
    if (compositori) compositori.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.IDCompositore;
        opt.textContent = c['Nome Compositore'];
        selComp.appendChild(opt);
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

avvio();