#!/usr/bin/env python3
"""
Classical Genius: da un file audio (MP3, WAV, ecc.) agli spezzoni MIDI di 10 secondi.

Uso:
    python converti.py brano.mp3 CODICE [--cartella audio] [--max-spezzoni 30]

Esempio:
    python converti.py beethoven_sinfonia5_m1.mp3 BEET_SIN05_M1

Cosa fa:
  1. Trascrive l'audio in MIDI con Basic Pitch.
  2. Taglia il MIDI in spezzoni da 10 secondi: audio/CODICE_001.mid, _002.mid, ...
  3. Copre tutto il brano. Se il brano e' lungo, prende uno spezzone ogni N secondi,
     con N = durata / max-spezzoni (mai meno di 10 secondi, quindi senza buchi nei brani brevi).
  4. Stampa il NumeroSpezzoni da scrivere nella tabella Brani.
"""
import argparse
import os
import sys

import pretty_midi
from basic_pitch import ICASSP_2022_MODEL_PATH
from basic_pitch.inference import Model, predict

DURATA_SPEZZONE = 10.0


def taglia(midi, inizio, durata=DURATA_SPEZZONE):
    """Restituisce un PrettyMIDI con le note comprese fra inizio e inizio+durata, riportate a zero."""
    fine = inizio + durata
    out = pretty_midi.PrettyMIDI()
    piano = pretty_midi.Instrument(program=0)
    for strumento in midi.instruments:
        for n in strumento.notes:
            if n.end <= inizio or n.start >= fine:
                continue
            piano.notes.append(pretty_midi.Note(
                velocity=n.velocity,
                pitch=n.pitch,
                start=max(n.start, inizio) - inizio,
                end=min(n.end, fine) - inizio,
            ))
    out.instruments.append(piano)
    return out, len(piano.notes)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("audio")
    ap.add_argument("codice")
    ap.add_argument("--cartella", default="audio")
    ap.add_argument("--max-spezzoni", type=int, default=30)
    a = ap.parse_args()

    os.makedirs(a.cartella, exist_ok=True)
    _, midi, _ = predict(a.audio, Model(ICASSP_2022_MODEL_PATH))
    durata = midi.get_end_time()
    passo = max(DURATA_SPEZZONE, durata / a.max_spezzoni)

    scritti = 0
    inizio = 0.0
    while inizio < durata - 1.0:  # niente code di meno di 1 secondo
        spezzone, n_note = taglia(midi, inizio)
        if n_note >= 5:  # salta i silenzi
            scritti += 1
            spezzone.write(os.path.join(a.cartella, f"{a.codice}_{scritti:03d}.mid"))
        inizio += passo

    print(f"{a.codice}: durata {durata:.0f}s, un spezzone ogni {passo:.0f}s, "
          f"NumeroSpezzoni = {scritti}")


if __name__ == "__main__":
    sys.exit(main())
