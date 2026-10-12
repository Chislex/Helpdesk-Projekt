import { useState, useEffect } from 'react';
import './App.css';

// HIER IST DEINE NEUE CLOUD-URL:
const API_URL = "https://helpdesk-backend-o7h0.onrender.com";

function App() {
  const [tickets, setTickets] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  // Tickets beim Start laden
  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await fetch(`${API_URL}/tickets`);
      const data = await response.json();
      setTickets(data);
    } catch (error) {
      console.error("Fehler beim Laden der Tickets:", error);
    }
  };

  const createTicket = async (e) => {
    e.preventDefault();
    if (!title || !description || !customerName) return;

    try {
      const response = await fetch(`${API_URL}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          customer_name: customerName
        })
      });
      const newTicket = await response.json();
      setTickets([...tickets, newTicket]);
      setTitle('');
      setDescription('');
      setCustomerName('');
    } catch (error) {
      console.error("Fehler beim Erstellen:", error);
    }
  };

  const updateStatus = async (id, newStatus, currentNotes) => {
    try {
      const response = await fetch(`${API_URL}/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          notes: currentNotes || ""
        })
      });
      const updatedTicket = await response.json();
      setTickets(tickets.map(t => t.id === id ? updatedTicket : t));
    } catch (error) {
      console.error("Fehler beim Aktualisieren:", error);
    }
  };

  const deleteTicket = async (id) => {
    try {
      const response = await fetch(`${API_URL}/tickets/${id}`, {
        method: 'DELETE'
      });
      const deletedTicket = await response.json();
      setTickets(tickets.map(t => t.id === id ? deletedTicket : t));
    } catch (error) {
      console.error("Fehler beim Löschen:", error);
    }
  };

  // Für das Kanban-Board filtern wir gelöschte Tickets (Soft-Delete) heraus
  const activeTickets = tickets.filter(t => !t.is_deleted);
  const columns = ["Offen", "In Bearbeitung", "Geschlossen"];

  return (
    <div className="app-container">
      <header>
        <h1>Helpdesk System</h1>
        <button onClick={() => setShowHistory(true)}>Logbuch / Historie öffnen</button>
      </header>

      <section className="ticket-form">
        <h2>Neues Ticket erstellen</h2>
        <form onSubmit={createTicket}>
          <input 
            type="text" 
            placeholder="Kundenname (Pflichtfeld)" 
            value={customerName} 
            onChange={(e) => setCustomerName(e.target.value)} 
            required 
          />
          <input 
            type="text" 
            placeholder="Ticket Titel" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            required 
          />
          <textarea 
            placeholder="Problembeschreibung" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            required 
          />
          <button type="submit">Ticket speichern</button>
        </form>
      </section>

      <section className="kanban-board" style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        {columns.map(colStatus => (
          <div key={colStatus} className="kanban-column" style={{ flex: 1, border: '1px solid #ccc', padding: '10px' }}>
            <h3>{colStatus}</h3>
            {activeTickets.filter(t => t.status === colStatus).map(ticket => (
              <div key={ticket.id} className="ticket-card" style={{ border: '1px solid #999', margin: '10px 0', padding: '10px' }}>
                <h4>{ticket.title}</h4>
                <p><strong>Kunde:</strong> {ticket.customer_name}</p>
                <p>{ticket.description}</p>
                
                <div className="ticket-actions">
                  <select 
                    value={ticket.status} 
                    onChange={(e) => updateStatus(ticket.id, e.target.value, ticket.notes)}
                  >
                    {columns.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={() => deleteTicket(ticket.id)} style={{ marginLeft: '10px' }}>Löschen</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </section>

      {/* Overlay für die Historie / Logbuch */}
      {showHistory && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', color: 'white', padding: '50px', overflowY: 'auto' }}>
          <div className="modal-content">
            <h2>Ticket Historie (Alle Tickets, auch gelöschte)</h2>
            <button onClick={() => setShowHistory(false)}>Schließen</button>
            <ul style={{ marginTop: '20px' }}>
              {tickets.map(ticket => (
                <li key={ticket.id} style={{ marginBottom: '10px' }}>
                  <strong>[{ticket.is_deleted ? "GELÖSCHT" : ticket.status}]</strong> - {ticket.title} (Kunde: {ticket.customer_name})
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;