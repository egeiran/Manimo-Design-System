## Workflow

1. Avklar med brukeren hvilken scene (hvis ikke gitt).
2. Snapshot alle beats: `node scripts/snapshot-scene.js motion/<id>.html`
3. Les hver PNG. Lag en kort liste i hodet: hvilke beats er statiske/
   svake i bevegelse? Hva ville bevegelse her *betydd*?
4. Velg 2–4 forbedringer. For hver: passer eksisterende primitive, eller
   trenger du en ny?
5. For nye primitives: skriv den + dokumenter + eksporter på window
   først. Test med en bitteliten dummy-bruk inni scenen for å se at den
   virker, før du integrerer den ordentlig.
6. Bygg endringene inn i scenens `.jsx`. Etter hver større endring:
   re-snapshot den berørte beat-en og les PNG-en for å verifisere.
7. `npm run lint` til slutt.
8. Hvis lokal: åpne `.html` i nettleser og scrubb gjennom hele scenen
   med lyden på. Bør føles mer levende uten at noe ser ødelagt ut.

## Out of scope

- Lage en helt ny scene
- Regenerere audio
- Endre narration-tekst
- Endre studio-UI eller andre ui_kits-filer
- Refaktorere motion-biblioteket strukturelt

## Output til brukeren

Beat-for-beat-oppsummering av hva som ble endret. Hvilke nye primitives
du la til (med 1-linjes doc). Steder hvor du ville pushet videre men
holdt igjen — flagg som forslag. Hvis scenen allerede føltes bra, si fra
og foreslå en annen — ikke finn på arbeid.