-- Utvider mat2b (TMA4411 Matematikk 2B):
--  * 18 nye chapter_quiz (3 per kapittel → 8 totalt per kapittel)
--  * 25 nye quiz_pool (positions 40–64 → totalt 65)
--  * Mer dybde i kapittel 4 (3 nye formler + 4 nye begreper)
--
-- Idempotens via posisjon-grenser: vi rør ikke seed-radene fra
-- 20260514100000_seed_mat2b_subject.sql (positions < grensen).

-- Slett tidligere utvidelses-rader så scriptet kan kjøres flere ganger.
delete from public.chapter_quiz
  where chapter_id in (select id from public.chapters where subject_id = 'mat2b')
    and position >= 5;

delete from public.quiz_pool
  where subject_id = 'mat2b' and position >= 40;

delete from public.chapter_formulas
  where chapter_id in (select id from public.chapters where subject_id = 'mat2b' and chapter_number = 4)
    and position >= 9;

delete from public.chapter_concepts
  where chapter_id in (select id from public.chapters where subject_id = 'mat2b' and chapter_number = 4)
    and position >= 16;

-- 1. Ekstra formler i kapittel 4 (Differensialligninger) -----------------
with c as (
  select id from public.chapters where subject_id = 'mat2b' and chapter_number = 4
)
insert into public.chapter_formulas (chapter_id, position, title, formula, explanation, importance)
select c.id, x.position, x.title, x.formula, x.explanation, x.importance
from c
cross join (values
  (9, 'Klassisk RK4',
    'u_{n+1} = u_n + \tfrac{h}{6}(K_1 + 2K_2 + 2K_3 + K_4)',
    'Den klassiske 4-stegs eksplisitte RK-metoden. K_1 = f(t_n, u_n), K_2 = f(t_n + h/2, u_n + (h/2)K_1), K_3 = f(t_n + h/2, u_n + (h/2)K_2), K_4 = f(t_n + h, u_n + hK_3). Global feil O(h^4).',
    'Høy'),
  (10, 'Midtpunktmetoden (RK2)',
    'u_{n+1} = u_n + h\, f\!\bigl(t_n + \tfrac{h}{2},\; u_n + \tfrac{h}{2}\, f(t_n, u_n)\bigr)',
    'Eksplisitt 2-stegs metode av orden 2. Bruker f evaluert i intervallets midtpunkt med en Euler-prediksjon der.',
    'Middels'),
  (11, 'Karakteristisk polynom',
    'p(\lambda) = \det(A - \lambda I)',
    'Røttene til p(λ) = 0 er egenverdiene til A. For 2×2: p(λ) = λ² − (spor A)λ + det A.',
    'Høy')
) as x(position, title, formula, explanation, importance);

-- 2. Ekstra begreper i kapittel 4 -----------------------------------------
with c as (
  select id from public.chapters where subject_id = 'mat2b' and chapter_number = 4
)
insert into public.chapter_concepts (chapter_id, position, term, definition)
select c.id, x.position, x.term, x.definition
from c
cross join (values
  (16, 'RK4',
    'Den klassiske 4-stegs eksplisitte Runge–Kutta-metoden. Global feil O(h⁴). Mest brukte ettstegs-metode i ingeniørberegninger.'),
  (17, 'Midtpunktmetoden',
    'Eksplisitt 2-stegs RK-metode av orden 2 som bruker f evaluert i intervallets midtpunkt etter en Euler-prediksjon. Også kalt eksplisitt midtpunkt.'),
  (18, 'Stive problemer',
    'Differensialligninger der løsningen inneholder komponenter med svært ulik tidsskala. Krever implisitte metoder (bakover-Euler, Crank–Nicolson) for stabilitet uten ekstrem liten h.'),
  (19, 'Spor og determinant',
    'For 2×2-matriser er spor(A) = a + d og det(A) = ad − bc. Det karakteristiske polynomet blir p(λ) = λ² − spor(A)·λ + det(A).')
) as x(position, term, definition);

-- 3. Flere chapter_quiz (3 nye per kapittel) ------------------------------
with c as (
  select id, chapter_number from public.chapters where subject_id = 'mat2b'
)
insert into public.chapter_quiz (chapter_id, position, question, options, answer, explanation)
select c.id, x.position, x.question, x.options::jsonb, x.answer::jsonb, x.explanation
from c
join (values
  -- Kapittel 1: Vektorrom
  (1, 5,
    'Hvor mange vektorer trengs MINST for å utspenne R^4?',
    '["3","4","5","8"]',
    '1',
    'Dim R^4 = 4. Et spenn må ha minst dim-mange vektorer. Med færre enn 4 kan vi ikke utspenne hele R^4.'),
  (1, 6,
    'Hva er Span{0}?',
    '["{0}","R^n","Tomme mengden","Hele rommet"]',
    '0',
    'Span av nullvektoren er bare {c·0 | c ∈ R} = {0}. Det trivielle underrommet.'),
  (1, 7,
    'Når er en mengde av n vektorer i R^n en basis?',
    '["Når de utspenner R^n","Når de er lineært uavhengige","Begge to (de er ekvivalente i dette tilfellet)","Aldri"]',
    '2',
    'Med eksakt n vektorer i et n-dimensjonalt rom er lineær uavhengighet og spenn ekvivalente egenskaper. En av delene er nok.'),
  -- Kapittel 2: Lineærtransformasjoner
  (2, 5,
    'Hva er T(0) for en lineærtransformasjon T : V → W?',
    '["Udefinert","0_W (nullvektoren i W)","1","Avhenger av T"]',
    '1',
    'T(0) = T(0·v) = 0·T(v) = 0_W. Følger direkte fra linearitet — ofte den raskeste sjekken om T er lineær.'),
  (2, 6,
    'En lineærtransformasjon T : R^4 → R^3 kan ALDRI være:',
    '["surjektiv","injektiv","null-avbildningen","identiteten"]',
    '1',
    'Rangteoremet: dim Ker T + dim Range T = 4, men Range T ⊆ R^3 har dim ≤ 3, så dim Ker T ≥ 1. T kan ikke være injektiv.'),
  (2, 7,
    'Overgangsmatrisen P_{C←B} er invertibel når:',
    '["B er ortonormal","C er ortonormal","B og C er basiser","Aldri"]',
    '2',
    'Enhver overgangsmatrise mellom basiser i samme rom er invertibel — invertert overgang er P_{B←C}.'),
  -- Kapittel 3: Indreproduktrom
  (3, 5,
    'En ortogonal mengde av ikke-null-vektorer er:',
    '["alltid en basis","alltid lineært uavhengig","alltid ortonormal","alltid lik standardbasisen"]',
    '1',
    'Tar ⟨c_1 v_1 + ⋯ + c_n v_n, v_k⟩ = 0; ortogonalitet gjør at alt unntatt c_k⟨v_k, v_k⟩ forsvinner, så c_k = 0. Uavhengig.'),
  (3, 6,
    'For en ortonormal basis {e_1, e_2, e_3} av V og v ∈ V, hva er ||v||²?',
    '["||e_1||² + ||e_2||² + ||e_3||²","⟨v, e_1⟩² + ⟨v, e_2⟩² + ⟨v, e_3⟩²","⟨v, e_1⟩ + ⟨v, e_2⟩ + ⟨v, e_3⟩","Σ e_i²"]',
    '1',
    'Parsevals identitet: med v = Σ ⟨v, e_i⟩ e_i og ortonormalitet er ||v||² = Σ ⟨v, e_i⟩².'),
  (3, 7,
    'Hvis dim V = 5 og dim W = 2 for et underrom W ⊆ V, hva er dim W^⊥?',
    '["2","3","5","7"]',
    '1',
    'V = W ⊕ W^⊥ for endeligdimensjonale indreproduktrom, så dim W^⊥ = dim V − dim W = 5 − 2 = 3.'),
  -- Kapittel 4: Differensialligninger
  (4, 5,
    'For diagonalisering A = PDP^{-1}: hva inneholder kolonnene i P?',
    '["egenverdier","egenvektorer","standardbasis","null"]',
    '1',
    'P har egenvektorene som kolonner; D har de tilhørende egenverdiene på diagonalen (i samme rekkefølge).'),
  (4, 6,
    'RK4 har global avbruddsfeil:',
    '["O(h)","O(h²)","O(h³)","O(h⁴)"]',
    '3',
    'Klassisk RK4 er av orden 4 — halverer du h, faller feilen med faktor 2⁴ = 16.'),
  (4, 7,
    'Hvilken metode passer best for stive problemer?',
    '["Eksplisitt Euler","RK4","Bakover-Euler (implisitt)","Heun"]',
    '2',
    'Stive problemer krever absoluttstabilitet for store h. Eksplisitte metoder har begrenset stabilitetsområde; implisitt (bakover) Euler er ubetinget stabil.'),
  -- Kapittel 5: Funksjoner og derivasjon
  (5, 5,
    'Hva er D_u f(a) når u står normalt på ∇f(a)?',
    '["||∇f(a)||","0","−||∇f(a)||","||u||·||∇f(a)||"]',
    '1',
    'D_u f(a) = ∇f(a)·u = 0 når u ⊥ ∇f(a). Geometrisk: vi beveger oss langs nivåkurven der f er konstant.'),
  (5, 6,
    'Standardstrategi for å bevise at lim_{(x,y)→(0,0)} f(x,y) IKKE finnes:',
    '["Vis at f er ubegrenset","Finn to retninger der grensen er ulik","Sjekk om f er kontinuerlig","Beregn ∇f"]',
    '1',
    'Hvis grensen langs y = 0 og langs y = x gir ulike svar, kan ingen felles grense eksistere. Et eneste motstridende eksempel er nok.'),
  (5, 7,
    'For f(x, y) = x² y er ∇f(2, 3) lik:',
    '["(12, 4)","(2x y, x²) = (12, 4)","(2xy, x²) = (4, 12)","(3, 2)"]',
    '0',
    'f_x = 2xy → 2·2·3 = 12; f_y = x² → 4. Gradienten er (12, 4).'),
  -- Kapittel 6: Ekstremalpunkter
  (6, 5,
    'For f(x, y) = x² − y² er punktet (0, 0) et:',
    '["lokalt minimum","lokalt maksimum","sadelpunkt","globalt minimum"]',
    '2',
    'f_xx = 2, f_yy = −2, f_xy = 0. D = 2·(−2) − 0 = −4 < 0 → sadelpunkt.'),
  (6, 6,
    'For f(x, y) = x² + y² er Hesse-matrisen og diskriminanten:',
    '["[[2,0],[0,2]], D = 4","[[1,0],[0,1]], D = 1","[[0,0],[0,0]], D = 0","[[2,2],[2,2]], D = 0"]',
    '0',
    'f_xx = f_yy = 2, f_xy = 0. H = diag(2, 2), D = 4 > 0, f_xx > 0 → kritisk pkt. (0,0) er lokalt minimum.'),
  (6, 7,
    'Ekstremalverdisetningen garanterer ikke globalt min/max for f hvis:',
    '["f er kontinuerlig","området er lukket og begrenset","området er åpent","f er deriverbar"]',
    '2',
    'Setningen krever LUKKET og begrenset (kompakt). På åpne områder kan f f.eks. nærme seg en grenseverdi uten å nå den.')
) as x(chapter_number, position, question, options, answer, explanation)
  on c.chapter_number = x.chapter_number;

-- 4. Flere quiz_pool (positions 40–64) ------------------------------------
insert into public.quiz_pool (subject_id, position, question, options, answer, chapter_number, part, source, explanation)
values
  ('mat2b', 40,
    'La p(x) = 3x² − 3x − 6 og q(x) = x² − x − 8. Kan r(x) = 4x² − 9x + 3 skrives som ap + bq?',
    '["Ja","Nei","Ja, men kun med komplekse koeffisienter","Avhenger av basis"]'::jsonb,
    '1'::jsonb,
    1, null, 'Plenum 1 oppg. 3',
    'Sett ap + bq = r: 3a+b=4, −3a−b=−9, −6a−8b=3. Fra (1) og (2): 3a+b=4 og 3a+b=9 — motstridende. Ingen løsning.'),
  ('mat2b', 41,
    'Er V = {[a, b] ∈ R² | a ≥ 0, b ≥ 0} et underrom av R²?',
    '["Ja","Nei, ikke lukket under negativ skalarmult.","Nei, inneholder ikke 0","Nei, ikke lukket under addisjon"]'::jsonb,
    '1'::jsonb,
    1, null, 'Plenum 1 oppg. 5',
    'V inneholder 0 og er lukket under addisjon, men f.eks. (−1)·(1, 1) = (−1, −1) ∉ V.'),
  ('mat2b', 42,
    'For T : M_{2×2} → M_{2×2}, T(A) = diag(a, d) (a, d er diagonalleddene): hva er kjernen?',
    '["{0}","{[[0,b],[c,0]] | b, c ∈ R}","Diagonalmatrisene","Hele M_{2×2}"]'::jsonb,
    '1'::jsonb,
    2, null, 'Plenum 2 oppg. 4',
    'T(A) = 0 ⇔ a = d = 0. Kjernen er matriser med null på diagonalen, fri på off-diagonalen — 2-dimensjonal.'),
  ('mat2b', 43,
    'For T : P_2 → R^2 gitt ved T(p) = (p(1), p(0))^T: er T injektiv?',
    '["Ja","Nei, dim Ker T = 1","Nei, dim Ker T = 2","Bare for monomer"]'::jsonb,
    '1'::jsonb,
    2, null, 'Plenum 2 oppg. 3b',
    'Ker T = Span{x² − x} — én dimensjon. Ikke injektiv.'),
  ('mat2b', 44,
    'For samme T (P_2 → R^2): rangteoremet gir dim Range T =',
    '["1","2","3","ukjent"]'::jsonb,
    '1'::jsonb,
    2, null, 'Plenum 2 oppg. 3b',
    'dim P_2 = 3, dim Ker T = 1, så dim Range T = 3 − 1 = 2. T er surjektiv (på R²).'),
  ('mat2b', 45,
    'For T(u) = 2u − 4w, T(v) = u + v + w, T(w) = −2u + v/2 i basis B = {u, v, w}: kolonne 2 i [T]_B er:',
    '["(2, 0, −4)^T","(1, 1, 1)^T","(0, 1/2, 0)^T","(−2, 0, 0)^T"]'::jsonb,
    '1'::jsonb,
    2, null, 'Plenum 3 oppg. 2a',
    'T(v) = u + v + w, så koordinatene er (1, 1, 1)^T.'),
  ('mat2b', 46,
    'Hvilken egenskap for projeksjonen proj_v u i R^n gjelder?',
    '["proj_v u står ortogonalt på v","u − proj_v u står ortogonalt på v","u − proj_v u = 0 alltid","proj_v u = u alltid"]'::jsonb,
    '1'::jsonb,
    2, null, 'Plenum 3 oppg. 3',
    'Per definisjon: u = proj_v u + (u − proj_v u), der projeksjonen er parallell med v og residualet (u − proj_v u) er ortogonalt.'),
  ('mat2b', 47,
    'To ikke-null-vektorer v_1 og v_2 i et indreproduktrom er ortogonale. Hva følger?',
    '["v_1 = c v_2","De er lineært avhengige","De er lineært uavhengige","||v_1|| = ||v_2||"]'::jsonb,
    '2'::jsonb,
    3, null, 'Plenum 3 oppg. 4',
    'av_1 + bv_2 = 0 ⇒ ⟨av_1 + bv_2, v_1⟩ = a||v_1||² = 0, så a = 0. Tilsvarende b = 0. Lineært uavhengig.'),
  ('mat2b', 48,
    'For Gram–Schmidt på {1 − x, −1 + x²} med ⟨f, g⟩ = f(0)g(0)+f(1)g(1)+f(2)g(2): hva er ⟨−1 + x², 1 − x⟩?',
    '["−4","−2","2","4"]'::jsonb,
    '0'::jsonb,
    3, null, 'Plenum 4 oppg. 1',
    '−1 + x² har verdier (−1, 0, 3); 1 − x har verdier (1, 0, −1). ⟨·⟩ = −1·1 + 0 + 3·(−1) = −4.'),
  ('mat2b', 49,
    'I samme Gram–Schmidt: w_2 = (−1 + x²) − (⟨−1 + x², w_1⟩ / ⟨w_1, w_1⟩) · (1 − x). Hva blir w_2 evaluert i x = 0?',
    '["−1","−3","1","3"]'::jsonb,
    '2'::jsonb,
    3, null, 'Plenum 4 oppg. 1',
    '⟨w_1, w_1⟩ = 2 og ⟨−1 + x², w_1⟩ = −4 (fra forrige). Koeffisient = −4/2 = −2. w_2 = (−1 + x²) − (−2)(1 − x) = x² − 2x + 1 = (1 − x)². I x = 0: w_2(0) = 1.'),
  ('mat2b', 50,
    'For matrisen A = [[2,−1],[1/2,1/2]] (Plenum 4 oppg. 3): hva er det(A)?',
    '["1/2","3/2","1","2"]'::jsonb,
    '1'::jsonb,
    4, null, 'Plenum 4 oppg. 3a',
    'det A = 2·(1/2) − (−1)·(1/2) = 1 + 1/2 = 3/2. Bekrefter at egenverdiene 1 og 3/2 multipliseres til 3/2.'),
  ('mat2b', 51,
    'Karakteristisk polynom for samme A er:',
    '["λ² − (5/2)λ + 3/2","λ² − 5λ + 3","λ² + (5/2)λ + 3/2","λ² − 5/2"]'::jsonb,
    '0'::jsonb,
    4, null, 'Plenum 4 oppg. 3a',
    'p(λ) = λ² − spor(A)·λ + det(A) = λ² − (2 + 1/2)λ + 3/2 = λ² − (5/2)λ + 3/2. Røtter: 1 og 3/2.'),
  ('mat2b', 52,
    'En 3-stegs RK med K_1 = f(t_n, u_n), K_2 = f(t_n + h, u_n + hK_1), K_3 = f(t_n + h/2, u_n + (h/4)(K_1 + K_2)) bruker hvilken c?',
    '["(0, 1, 1/2)^T","(1/2, 1, 0)^T","(0, 0, 1/2)^T","(0, 1/2, 1)^T"]'::jsonb,
    '0'::jsonb,
    4, null, 'Plenum 5 oppg. 2b',
    'K_i = f(t_n + c_i h, …). Her: c_1 = 0, c_2 = 1, c_3 = 1/2. Vektoren c = (0, 1, 1/2)^T.'),
  ('mat2b', 53,
    'For samme 3-stegs RK på y'' = y² + t, y(0) = 1, h = 0.1: K_2 = f(0.1, 1 + 0.1·1) = ?',
    '["1","1.21","1.31","2.31"]'::jsonb,
    '2'::jsonb,
    4, null, 'Plenum 5 oppg. 2a',
    'K_2 = f(0.1, 1.1) = 1.1² + 0.1 = 1.21 + 0.1 = 1.31.'),
  ('mat2b', 54,
    'For Heuns metode på y'' = f(y) (autonomt), Taylor-utvikling viser at lokal feil er:',
    '["O(h)","O(h²)","O(h³)","O(h⁴)"]'::jsonb,
    '2'::jsonb,
    4, null, 'Plenum 5 oppg. 3',
    'Heun har orden 2, så lokal trunkeringsfeil er O(h^{p+1}) = O(h^3). Vises ved å sammenligne Taylor-rekka for y(t_{n+1}) og u_{n+1} med f''-leddet.'),
  ('mat2b', 55,
    'Klassisk RK4-metode har hvor mange evalueringer av f per steg?',
    '["1","2","4","6"]'::jsonb,
    '2'::jsonb,
    4, null, 'Pensum uke 10',
    'RK4 har s = 4 stegs-stadier (K_1, K_2, K_3, K_4) som hver krever én evaluering av f.'),
  ('mat2b', 56,
    'For y'' = Ay med komplekse egenverdier α ± iβ er løsningen reell hvis:',
    '["α = 0","Initialverdien er reell","β = 0","Vi tar realdelen"]'::jsonb,
    '1'::jsonb,
    4, null, 'Pensum uke 8',
    'Med reell A og reell y(0) er løsningen automatisk reell. De komplekse egenmodusene kombineres til e^{αt}(C_1 cos βt + C_2 sin βt).'),
  ('mat2b', 57,
    'For 2.-ordens y'''' − 4y'' + 4y = 0 er karakteristisk lign. r² − 4r + 4 = 0. Generell løsning:',
    '["C_1 e^{2t} + C_2 e^{−2t}","(C_1 + C_2 t) e^{2t}","C_1 cos 2t + C_2 sin 2t","C_1 e^{2t} + C_2 e^{2t}"]'::jsonb,
    '1'::jsonb,
    4, null, 'Pensum uke 8',
    'Dobbeltrot r = 2 gir y = (C_1 + C_2 t) e^{2t}. Andre ledd må multipliseres med t for å gi to lineært uavhengige løsninger.'),
  ('mat2b', 58,
    'For f(x, y) = sin(x + y) er ∂²f/∂x∂y i (0, 0):',
    '["0","1","−1","cos 1"]'::jsonb,
    '0'::jsonb,
    5, null, 'Pensum uke 12',
    '∂f/∂x = cos(x + y); ∂/∂y av det er −sin(x + y). I (0, 0): −sin 0 = 0.'),
  ('mat2b', 59,
    'For f(x, y) = (x² + y²)/(x² − y² + 1) i punktet (0, 0): grensen og kontinuitet?',
    '["Grensen finnes ikke","Grense = 0, kontinuerlig","Grense = 1, kontinuerlig","f er ikke definert i (0, 0)"]'::jsonb,
    '1'::jsonb,
    5, null, 'Pensum uke 12',
    'f(0, 0) = 0/1 = 0. lim_{(x,y)→(0,0)} = 0 (teller og nevner er kontinuerlige; nevner ≠ 0). Kontinuerlig.'),
  ('mat2b', 60,
    'I retning u = (1, 0) er D_u f(a) lik:',
    '["∇f(a)","f(a)","f_x(a)","∂f/∂x(a) · ∂f/∂y(a)"]'::jsonb,
    '2'::jsonb,
    5, null, 'Pensum uke 12',
    'D_u f = ∇f · u = (f_x, f_y) · (1, 0) = f_x. Retningsderivert langs x-aksen er partiell-deriverte med hensyn på x.'),
  ('mat2b', 61,
    'For f(x, y) = e^{xy} er ∇f(1, 0) lik:',
    '["(0, 1)","(1, 0)","(0, 0)","(e, e)"]'::jsonb,
    '0'::jsonb,
    5, null, 'Pensum uke 12',
    'f_x = y e^{xy}, f_y = x e^{xy}. I (1, 0): f_x = 0·1 = 0, f_y = 1·1 = 1. Gradienten er (0, 1).'),
  ('mat2b', 62,
    'For f(x, y) = x³ − 3xy + y³ er stasjonære punkt:',
    '["(0, 0)","(0, 0) og (1, 1)","(1, 1) og (−1, −1)","Ingen"]'::jsonb,
    '1'::jsonb,
    6, null, 'Pensum uke 16',
    '∇f = (3x² − 3y, −3x + 3y²) = 0 gir y = x² og x = y². Innsatt: x = x⁴ ⇒ x = 0 eller x = 1 (reell). Stasjonære punkt: (0, 0) og (1, 1).'),
  ('mat2b', 63,
    'For samme f er Hesse i (1, 1):',
    '["[[6, −3], [−3, 6]], D > 0, f_xx > 0 → lok. min.","[[0, −3], [−3, 0]], D < 0 → sadel","[[6, −3], [−3, 6]], D = 27, f_xx > 0 → lok. min.","[[6, 0], [0, 6]], D > 0 → lok. min."]'::jsonb,
    '2'::jsonb,
    6, null, 'Pensum uke 16',
    'f_xx = 6x = 6; f_yy = 6y = 6; f_xy = −3. D = 36 − 9 = 27 > 0, f_xx = 6 > 0 → lokalt minimum i (1, 1).'),
  ('mat2b', 64,
    'I (0, 0) for samme f er Hesse:',
    '["[[0, −3], [−3, 0]], D = −9 → sadel","[[6, 0], [0, 6]] → lok. min.","D = 0, ubestemt","[[3, −3], [−3, 3]] → ubestemt"]'::jsonb,
    '0'::jsonb,
    6, null, 'Pensum uke 16',
    'I (0, 0): f_xx = f_yy = 0, f_xy = −3. D = 0 − 9 = −9 < 0 → sadelpunkt.');

-- Done. Antall innslag etter migrasjon:
--  * chapter_formulas: 51 + 3 = 54
--  * chapter_concepts: 83 + 4 = 87
--  * chapter_quiz:     30 + 18 = 48 (8 per kapittel)
--  * quiz_pool:        40 + 25 = 65
