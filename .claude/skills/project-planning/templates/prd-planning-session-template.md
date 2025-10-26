# PRD Planning Session - Prompt Template

## Purpose

Ten template to prompt do przeprowadzenia sesji planistycznej PRD z AI. Generuje listę pytań i zaleceń, które pomogą zdefiniować szczegółowe wymagania produktu.

---

## Prompt Template

```
Jesteś doświadczonym menedżerem produktu, którego zadaniem jest pomoc w stworzeniu
kompleksowego dokumentu wymagań projektowych (PRD) na podstawie dostarczonych informacji.
Twoim celem jest wygenerowanie listy pytań i zaleceń, które zostaną wykorzystane
w kolejnym promptowaniu do utworzenia pełnego PRD.

Prosimy o uważne zapoznanie się z poniższymi informacjami:

<project_description>
{{project-highlevel}} <- przekopiuj wysokopoziomowy opis projektu
</project_description>

Przeanalizuj dostarczone informacje, koncentrując się na aspektach istotnych dla tworzenia PRD.
Rozważ następujące kwestie:

<prd_analysis>
1. Zidentyfikuj główny problem, który produkt ma rozwiązać.
2. Określ kluczowe funkcjonalności MVP.
3. Rozważ potencjalne historie użytkownika i ścieżki korzystania z produktu.
4. Pomyśl o kryteriach sukcesu i sposobach ich mierzenia.
5. Oceń ograniczenia projektowe i ich wpływ na rozwój produktu.
</prd_analysis>

Na podstawie analizy wygeneruj listę 10 pytań i zaleceń w formie łączonej (pytanie + zalecenie).
Powinny one dotyczyć wszelkich niejasności, potencjalnych problemów lub obszarów, w których
potrzeba więcej informacji, aby stworzyć skuteczny PRD.

Rozważ pytania dotyczące:
1. Szczegółów problemu użytkownika
2. Priorytetyzacji funkcjonalności
3. Oczekiwanego doświadczenia użytkownika
4. Mierzalnych wskaźników sukcesu
5. Potencjalnych ryzyk i wyzwań
6. Harmonogramu i zasobów

<pytania>
Wymień tutaj swoje pytania i zalecenia, ponumerowane dla jasności:

Przykładowo:
1. Czy już od startu projektu planujesz wprowadzenie płatnych subskrypcji?

   Rekomendacja: Pierwszy etap projektu może skupić się na funkcjonalnościach darmowych,
   aby przyciągnąć użytkowników, a płatne funkcje można wprowadzić w późniejszym etapie.
</pytania>

Kontynuuj ten proces, generując nowe pytania i rekomendacje w oparciu o odpowiedzi użytkownika,
dopóki użytkownik wyraźnie nie poprosi o podsumowanie.

Pamiętaj, aby skupić się na jasności, trafności i dokładności wyników.
Nie dołączaj żadnych dodatkowych komentarzy ani wyjaśnień poza określonym formatem wyjściowym.
```

---

## Alternatywny Prompt (dla modeli reasoningowych)

```
Jesteś doświadczonym menedżerem produktu, którego zadaniem jest pomoc w stworzeniu
kompleksowego dokumentu wymagań projektowych (PRD) na podstawie dostarczonych informacji.

Pracę analityczną należy przeprowadzić w bloku myślenia. Końcowe dane wyjściowe powinny
składać się wyłącznie z pytań i zaleceń i nie powinny powielać ani powtarzać żadnej pracy
wykonanej w sekcji prd_analysis.

<project_description>
{{project-highlevel}} <- przekopiuj wysokopoziomowy opis projektu
</project_description>

Przeanalizuj dostarczone informacje w bloku myślenia (<thinking>), koncentrując się
na aspektach istotnych dla tworzenia PRD:

1. Zidentyfikuj główny problem, który produkt ma rozwiązać.
2. Określ kluczowe funkcjonalności MVP.
3. Rozważ potencjalne historie użytkownika i ścieżki korzystania z produktu.
4. Pomyśl o kryteriach sukcesu i sposobach ich mierzenia.
5. Oceń ograniczenia projektowe i ich wpływ na rozwój produktu.

Na podstawie analizy wygeneruj listę 10 pytań i zaleceń w formie łączonej (pytanie + zalecenie).

Format wyjściowy:
<pytania>
1. [Pytanie]

   Rekomendacja: [Zalecenie]

2. [Pytanie]

   Rekomendacja: [Zalecenie]

...
</pytania>
```

---

## Przykład Użycia

### Input (project-highlevel):

```
Photo Map MVP to aplikacja do zarządzania zdjęciami z geolokalizacją.

Core Problem: Trudno zarządzać i przeglądać dużą kolekcję zdjęć z różnych miejsc i dat.

Solution: Aplikacja umożliwia upload zdjęć, automatyczną ekstrakcję GPS z EXIF,
wyświetlanie w galerii (grid) oraz na mapie (markers + clustering).

Target Users: Fotografowie amatorzy, podróżnicy.

Tech Stack: Angular 18 + Spring Boot 3 + PostgreSQL 15

Deployment: Mikrus VPS (limited resources)
```

### Output (AI Generated):

```
1. Czy planowane są płatne subskrypcje?

   Rekomendacja: Pierwszy etap projektu może skupić się na funkcjonalnościach darmowych,
   aby przyciągnąć użytkowników, a płatne funkcje można wprowadzić w późniejszym etapie.

2. Jakie formaty zdjęć będą wspierane w MVP?

   Rekomendacja: Dla uproszczenia MVP, sugeruję skupienie się na JPEG i PNG. HEIC/HEIF
   można dodać w późniejszym etapie, ponieważ wymaga dodatkowej konwersji.

3. Czy użytkownicy mogą udostępniać zdjęcia publicznie (sharing)?

   Rekomendacja: Dla MVP, zalecam prywatne zdjęcia (user-scoped). Public sharing
   można dodać jako feature post-MVP, aby skupić się na core functionality.

4. Jakie są dokładne constraints Mikrus VPS (CPU, RAM, storage)?

   Rekomendacja: Warto poznać dokładne limity, aby zaplanować optymalizacje (caching,
   thumbnail sizes, concurrent users).

5. Czy batch upload jest wymagany w MVP?

   Rekomendacja: Batch upload (upload wielu zdjęć naraz) może być przydatny dla
   power users. Jeśli tak, rozważ async processing (Spring Integration) aby nie
   blokować UI.

... (5 więcej pytań)
```

---

## Guidelines

### Ile rund pytań należy odbyć?

**Side project / MVP:** 3-5 rund wystarczy
**Komercyjny projekt:** 10-20+ rund (więcej stakeholders, wymagań)

### Kiedy zakończyć sesję?

- Wszystkie kluczowe kwestie są wyjaśnione
- Brak major uncertainties
- Użytkownik czuje się confident z direction
- Użytkownik prosi o podsumowanie

### Red Flags - AI proponuje:

- ⚠️ Over-engineered solution (mikroservices dla MVP)
- ⚠️ Exotic technologies (long learning curve)
- ⚠️ Ignoruje constraints (Mikrus VPS → Redis, Celery)
- ⚠️ Out-of-scope features (comments, sharing w MVP)

**Jak reagować:**
- Pytać: "Czy to nie jest za złożone dla MVP?"
- Sprawdzać: "Czy to jest zgodne z constraints?"
- Upraszczać: "Jaka jest MINIMALNA wersja tej funkcji?"

---

## Next Steps After Session

1. **Podsumowanie sesji** - użyj `templates/prd-summary-template.md`
2. **Generowanie PRD** - użyj podsumowania do stworzenia `.ai/prd.md`
3. **Analiza tech stack** - użyj `templates/tech-stack-analysis-template.md`
4. **Szczegółowe plany** - stwórz `.ai/db-plan.md`, `api-plan.md`, `ui-plan.md`

---

## Related Documentation

- `references/10xdevs-methodology.md` - pełna metodologia z kursu
- `references/prd-planning-process.md` - proces planowania PRD
- `templates/prd-summary-template.md` - template do podsumowania
- `.ai/prd.md` - przykład finalnego PRD
