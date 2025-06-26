
# TDI2 – Dependency Injection for Scalable React Architectures

## Motivation

React wurde ursprünglich als deklarative UI-Library für kleine bis mittlere Anwendungen konzipiert. Mit zunehmender Komplexität und Größe verschieben sich jedoch die Anforderungen: Modularität, Austauschbarkeit, Testing und Environment-basierte Konfiguration gewinnen an Bedeutung. Das idiomatische React-Modell (Props, Context, Hooks) skaliert in diesen Szenarien nicht mehr systematisch.

TDI2 versucht, diesen Bruch aufzufangen – durch einen formalisierten, containerbasierten Ansatz für Dependency Injection, ähnlich etablierten Patterns aus dem Java-Ökosystem (z. B. Spring Framework).

---

## Probleme im aktuellen React-Ökosystem

### 1. Harte Kopplung durch direkte Importe
Komponenten referenzieren Services direkt via `import`, wodurch jede Austauschbarkeit verloren geht.

### 2. Props-Drilling und manuelle Composition
Daten- und Funktionsweitergabe über mehrere Komponentenebenen erzeugt strukturelle Abhängigkeit und Redundanz.

### 3. Kein zentrales Lifecycle- oder Abhängigkeitsmanagement
React bietet keine native Möglichkeit, Services zentral zu registrieren, zu profilieren oder zu scopen.

### 4. Testing und Mocking fragmentiert
Mocks müssen manuell injiziert oder durch globale Store-Anpassungen ersetzt werden.

### 5. Kein Environment- oder Profilkonzept
React kennt keine servicebezogene Umgebungskonfiguration (z. B. Test vs. Prod) auf Architekturebene.

---

## Lösungsidee von TDI2

- Einführung eines Compile-Time-Resolvers für Abhängigkeiten
- Nutzung von TypeScript-Metadaten für automatische Injection
- Verwendung von Hooks als injizierbare Schnittstelle (`useService`)
- Profil- und Scoping-Unterstützung für Umgebungskonfiguration
- Unterstützung für OpenTelemetry, Logging, Linting und Debugging
- Auflösung zur Buildzeit statt zur Laufzeit für maximale Performance

---

## Vorteile

- Entkopplung von Komponenten und Abhängigkeiten
- Testbarkeit durch systematisches Mock-Injection
- Einheitliche Architektur unabhängig vom Team
- Automatische Fehlerlokalisierung durch Logging/Tracing
- Konsistentes Verhalten über Environments hinweg

---

## Roadmap

### Phase 1: Fundament
- [x] Compile-Time DI Resolver
- [x] Decorator-gestützte Service-Registrierung
- [x] `useService` Hook
- [ ] Basic Unit Testing Support

### Phase 2: Umgebung und Lifecycle
- [ ] Profile/Environment-Support (`@Profile`)
- [ ] Scope-Typen (Singleton, Transient, Request)
- [ ] Lifecycle Hooks (onInit, onDestroy)

### Phase 3: Integration
- [ ] Babel/TS-Transformer für Codegen
- [ ] ESLint-Plugin zur Regelverifikation
- [ ] Integration mit OpenTelemetry
- [ ] DevTools-Schnittstelle

### Phase 4: Stabilisierung
- [ ] Type-safe Mocks
- [ ] Snapshot Debugging
- [ ] SSR-Kompatibilität
- [ ] Hot Module Replacement (HMR) Support

---

## Ergänzende Sektionen

### Architekturmodell

```plaintext
Application Layer
├── Controller Components
│   └── useService(InvoiceService)
├── UI Components
│   └── Presentational only
Domain Layer
├── Interfaces (e.g. InvoiceService)
├── Logic (e.g. DefaultInvoiceService)
Infrastructure Layer
├── HttpAdapters
├── Mock Implementations
```

### Zielgruppe

- Enterprise-React-Anwendungen mit hoher Komplexität
- Teams mit Bedarf nach austauschbarer Infrastruktur
- Projekte mit mehreren Environments und Profilen
- Anwendungen mit strikten Test- und Logging-Anforderungen

---

## Fazit

TDI2 zielt auf die strukturelle Reorganisation reaktiver Architekturen, ohne das deklarative Fundament von React zu unterwandern. Der Ansatz ist bewusst systematisch, nicht idiomatisch – als Brücke zwischen konventionellem Frontend und architekturgetriebener Softwareentwicklung.
