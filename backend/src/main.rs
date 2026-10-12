use axum::{
    extract::{Path, State},
    routing::{get, post, put, delete},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgPoolOptions, PgPool, FromRow}; // <-- NEU: FromRow importiert
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;

#[derive(Serialize, FromRow)] // <-- NEU: FromRow hinzugefügt
struct Ticket {
    id: i32,
    title: String,
    description: String,
    status: Option<String>,
    notes: Option<String>,
    customer_name: Option<String>,
    is_deleted: Option<bool>,
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
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://admin:secret@localhost:5432/helpdesk".to_string());

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Fehler: Konnte nicht mit der Datenbank verbinden!");

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
        .route("/tickets/:id", put(update_ticket).delete(delete_ticket))
        .layer(cors)
        .with_state(pool);

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
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
    // NEU: Wir nutzen query_as ohne das "!" und binden die Variablen manuell an
    let record = sqlx::query_as::<_, Ticket>(
        "INSERT INTO tickets (title, description, customer_name) VALUES ($1, $2, $3) RETURNING id, title, description, status, notes, customer_name, is_deleted"
    )
    .bind(&payload.title)
    .bind(&payload.description)
    .bind(&payload.customer_name)
    .fetch_one(&pool)
    .await
    .expect("Fehler beim Speichern in die Datenbank");

    Json(record)
}

async fn get_tickets(State(pool): State<PgPool>) -> Json<Vec<Ticket>> {
    let records = sqlx::query_as::<_, Ticket>(
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
    let record = sqlx::query_as::<_, Ticket>(
        "UPDATE tickets SET status = $1, notes = $2 WHERE id = $3 RETURNING id, title, description, status, notes, customer_name, is_deleted"
    )
    .bind(&payload.status)
    .bind(&payload.notes)
    .bind(id)
    .fetch_one(&pool)
    .await
    .expect("Fehler beim Updaten");

    Json(record)
}

async fn delete_ticket(
    State(pool): State<PgPool>,
    Path(id): Path<i32>,
) -> Json<Ticket> {
    let record = sqlx::query_as::<_, Ticket>(
        "UPDATE tickets SET is_deleted = TRUE WHERE id = $1 RETURNING id, title, description, status, notes, customer_name, is_deleted"
    )
    .bind(id)
    .fetch_one(&pool)
    .await
    .expect("Fehler beim Löschen");

    Json(record)
}
// --- TESTS ---
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ticket_creation() {
        // Wir testen hier virtuell, ob unsere Datenstruktur richtig funktioniert
        let ticket = CreateTicket {
            title: "Drucker kaputt".to_string(),
            description: "Es kommt nur noch schwarzes Papier raus.".to_string(),
            customer_name: "Firma Müller".to_string(),
        };

        assert_eq!(ticket.title, "Drucker kaputt");
        assert_eq!(ticket.customer_name, "Firma Müller");
    }
}