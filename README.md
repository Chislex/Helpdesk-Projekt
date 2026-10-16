# Full-Stack Helpdesk-System

Ein modernes, containerisiertes IT-Ticketsystem mit Kanban-Board, entwickelt als Schulprojekt zur Demonstration einer Full-Stack-Architektur.

## Tech Stack
* Frontend: React, Vite, JavaScript, CSS
* Backend: Rust, Axum, SQLx
* Datenbank: PostgreSQL
* Infrastruktur: Docker & Docker Compose
* CI/CD: GitHub Actions (Automatisierte Tests)

## Kernfunktionen
* Kanban-Board: Übersichtliche Verwaltung der Tickets in den Spalten "Offen", "In Bearbeitung" und "Geschlossen".
* Kundenverwaltung: Pflichtfelder für Kundennamen bei der Ticketerstellung.
* Sicheres Löschen: Soft-Delete-Funktion (Tickets verschwinden vom Board, bleiben aber für Audits in der Datenbank).
* Historie: Separates Logbuch-Overlay zur Nachverfolgung aller (auch gelöschter) Tickets.

## Projekt lokal starten
Das gesamte Projekt ist vollständig dockerisiert. Es müssen keine lokalen Abhängigkeiten (außer Docker Desktop) installiert werden.

1. Repository klonen: git clone (https://github.com/Chislex/Helpdesk-Projekt/tree/main)
2. Container bauen und starten: docker compose up --build -d
3. Die Web-Oberfläche ist nun unter [http://localhost:5173](http://localhost:5173/) erreichbar. Das Backend läuft unter http://localhost:3000.
