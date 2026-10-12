use axum::{
    extract::{Path, State},
    routing::{get, post, put, delete},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgPoolOptions, PgPool};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;

#[derive(Serialize)]
struct Ticket {
    id: i32,
    title: String,
    description: String,
    status: Option<String>,
    notes: Option<String>,
    customer_name: Option<String>, // NEU: Kundenname
    is_deleted: Option<bool>,      // NEU: Soft-Delete Flag
}

#[derive(Deserialize)]
struct CreateTicket {
    title: String,
    description: String,
    customer_name: String,
}

#[derive(Deserialize)]
struct UpdateTicket {
    status: String,
    notes: String,
}

#[tokio::main]
async fn main() {
    let database_url = "postgres://admin:secret@localhost:5432/helpdesk";
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(database_url)
        .await
        .expect("Fehler: Konnte nicht mit der Datenbank verbinden!");

    // Die Tabelle beim Start anpassen, falls sie neu erstellt wird
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS tickets (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            status VARCHAR(50) DEFAULT 'Offen',
            notes TEXT DEFAULT '',
            customer_name TEXT DEFAULT 'Unbekannt',
            is_deleted BOOLEAN DEFAULT FALSE
        );
        "#
    )
    .execute(&pool)
    .await
    .expect("Fehler beim Erstellen der Tabelle");

    println!("Datenbank-Tabelle 'tickets' ist bereit!");

    let cors = CorsLayer::permissive();

    let app = Router::new()
        .route("/", get(root))
        .route("/tickets", post(create_ticket).get(get_tickets))
        .route("/tickets/:id", put(update_ticket).delete(delete_ticket)) // NEU: Delete-Route
        .layer(cors)
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
        "INSERT INTO tickets (title, description, customer_name) VALUES ($1, $2, $3) RETURNING id, title, description, status, notes, customer_name, is_deleted",
        payload.title,
        payload.description,
        payload.customer_name
    )
    .fetch_one(&pool)
    .await
    .expect("Fehler beim Speichern in die Datenbank");

    Json(record)
}

async fn get_tickets(State(pool): State<PgPool>) -> Json<Vec<Ticket>> {
    let records = sqlx::query_as!(
        Ticket,
        "SELECT id, title, description, status, notes, customer_name, is_deleted FROM tickets ORDER BY id ASC"
    )
    .fetch_all(&pool)
    .await
    .expect("Fehler beim Abrufen aus der Datenbank");

    Json(records)
}

async fn update_ticket(
    State(pool): State<PgPool>,
    Path(id): Path<i32>,
    Json(payload): Json<UpdateTicket>,
) -> Json<Ticket> {
    let record = sqlx::query_as!(
        Ticket,
        "UPDATE tickets SET status = $1, notes = $2 WHERE id = $3 RETURNING id, title, description, status, notes, customer_name, is_deleted",
        payload.status,
        payload.notes,
        id
    )
    .fetch_one(&pool)
    .await
    .expect("Fehler beim Updaten");

    Json(record)
}

// NEU: Funktion zum Löschen (Soft-Delete)
async fn delete_ticket(
    State(pool): State<PgPool>,
    Path(id): Path<i32>,
) -> Json<Ticket> {
    let record = sqlx::query_as!(
        Ticket,
        "UPDATE tickets SET is_deleted = TRUE WHERE id = $1 RETURNING id, title, description, status, notes, customer_name, is_deleted",
        id
    )
    .fetch_one(&pool)
    .await
    .expect("Fehler beim Löschen");

    Json(record)
}