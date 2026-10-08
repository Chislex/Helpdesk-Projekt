use axum::{
    extract::State,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgPoolOptions, PgPool};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer; // <-- NEU: Import für CORS

#[derive(Serialize)]
struct Ticket {
    id: i32,
    title: String,
    description: String,
    status: Option<String>,
}

#[derive(Deserialize)]
struct CreateTicket {
    title: String,
    description: String,
}

#[tokio::main]
async fn main() {
    let database_url = "postgres://admin:secret@localhost:5432/helpdesk";
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(database_url)
        .await
        .expect("Fehler: Konnte nicht mit der Datenbank verbinden!");

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS tickets (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            status VARCHAR(50) DEFAULT 'Offen'
        );
        "#
    )
    .execute(&pool)
    .await
    .expect("Fehler beim Erstellen der Tabelle");

    println!("Datenbank-Tabelle 'tickets' ist bereit!");

    // ---> NEU: Erlaubt alle Anfragen von außen (verhindert den Browser-Blocker) <---
    let cors = CorsLayer::permissive();

    let app = Router::new()
        .route("/", get(root))
        .route("/tickets", post(create_ticket).get(get_tickets))
        .layer(cors) // <-- NEU: CORS wird an den Server angehängt
        .with_state(pool);

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("Server läuft erfolgreich auf http://{}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn root() -> &'static str {
    "Willkommen bei der Helpdesk API - Das Backend funktioniert!"
}

async fn create_ticket(
    State(pool): State<PgPool>,
    Json(payload): Json<CreateTicket>,
) -> Json<Ticket> {
    let record = sqlx::query_as!(
        Ticket,
        "INSERT INTO tickets (title, description) VALUES ($1, $2) RETURNING id, title, description, status",
        payload.title,
        payload.description
    )
    .fetch_one(&pool)
    .await
    .expect("Fehler beim Speichern in die Datenbank");

    Json(record)
}

async fn get_tickets(State(pool): State<PgPool>) -> Json<Vec<Ticket>> {
    let records = sqlx::query_as!(
        Ticket,
        "SELECT id, title, description, status FROM tickets ORDER BY id ASC"
    )
    .fetch_all(&pool)
    .await
    .expect("Fehler beim Abrufen aus der Datenbank");

    Json(records)
}