# Istruzioni Import da Excel - Availability Automatica

## Formato matrice Excel (Approccio Ibrido)

Il sistema **inferisce automaticamente** la disponibilità degli optionals in base al **prefisso del code** e alla **presenza di prezzo**.

### Struttura semplificata

```
| code | MT_dorin | MT_bitzer | ... | carel | danfoss_782 | wurm | ... |
```

**Nessuna colonna _availability necessaria!** ✅

### Come funziona

Il sistema analizza ogni riga e:
1. **Estrae il machineType** dal prefisso del code:
   - `T...` → TAGO
   - `MBS...` → MBS
   - `MCB...` → MCB

2. **Controlla il valore** dell'optional:
   - **Prezzo > 0** → disponibile per quel machineType
   - **0** → Included (disponibile gratis)
   - **NA/null** → NOT available (non mostrare)

3. **Raccoglie automaticamente** le availability da tutte le righe

### Esempio pratico

| code | carel | danfoss_782 | wurm |
|------|-------|-------------|------|
| T2_10_0 | 1860 | 2800 | NA |
| T2_15_0 | 1860 | 2800 | NA |
| MBS2_10_0 | NA | 2800 | 2000 |
| MCB2_10_0 | NA | 0 | 2000 |

**Risultato automatico:**
- **Carel**: `availability: ["TAGO"]` (presente solo in righe T...)
- **Danfoss 782**: `availability: ["TAGO", "MBS", "MCB"]` (presente in tutte le righe)
- **WURM**: `availability: ["MBS", "MCB"]` (NA per TAGO)

### Valori supportati

**Prezzo numerico (es. 1860, 2800)**
- Optional disponibile per quel machineType
- Prezzo mostrato normalmente

**0 (zero)**
- Optional disponibile per quel machineType
- Mostra "**Included**" invece del prezzo
- **NON viene sommato** al totale

**NA / cella vuota / null**
- Optional **NON disponibile** per quel machineType
- **Non viene mostrato** nello step

### Prezzi diversi per gamme

Se vuoi prezzi diversi per gamme diverse:

| code | wurm | Nota |
|------|------|------|
| T2_10_0 | 2000 | WURM costa €2000 per TAGO |
| MBS2_10_0 | 1500 | WURM costa €1500 per MBS |
| MCB2_10_0 | NA | WURM non disponibile per MCB |

Il sistema calcola il **prezzo medio** (€1750) ma mantiene le availability corrette.

### Note importanti

1. ✅ **Compattezza**: Solo 42 colonne totali (vs 47 con _availability)
2. ✅ **Zero intreccio**: Ogni riga è indipendente
3. ✅ **Intuitivo**: Se c'è prezzo → disponibile, se NA → non disponibile
4. ✅ **Flessibilità**: Prezzi diversi per gamme diverse
5. ⚠️ **Coerenza**: Se un optional è disponibile per TAGO, metti un valore in TUTTE le righe TAGO (anche 0 se included)

### Compatibilità

- ✅ Import/Export JSON mantiene il campo `availability`
- ✅ Vecchie matrici senza availability funzionano (availability omessa = disponibile ovunque)
- ✅ Pulsante "📋 Copia Header Excel" genera le 42 colonne corrette

### Cablaggio

- Aggiungi la colonna **Cablaggio standard** (dopo **Quadro elettrico**) per il costo base cablaggio.
- Il costo extra al metro non sta in Excel: usa `pricing-extras.json` con `cablingExtraPerMeter` per TAGO/MBS/MCB.
