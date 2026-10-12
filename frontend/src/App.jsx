import { useState, useEffect } from 'react';
import './App.css';

const API_URL = "https://helpdesk-backend-o7h0.onrender.com";

function App() {
  const [tickets, setTickets] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [showHistory, setShowHistory] = useState(false);

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

  const activeTickets = tickets.filter(t => !t.is_deleted);
  const columns = ["Offen", "In Bearbeitung", "Geschlossen"];

  return (
    <div className="app-container">
      <header>
        <h1>Helpdesk System</h1>
        <button className="header-btn" onClick={() => setShowHistory(true)}>
          Logbuch / Historie öffnen
        </button>
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
          <button type="submit" className="submit-btn">Ticket speichern</button>
        </form>
      </section>

      <section className="kanban-board">
        {columns.map(colStatus => (
          <div key={colStatus} className="kanban-column">
            <h3>{colStatus}</h3>
            {activeTickets.filter(t => t.status === colStatus).map(ticket => (
              <div key={ticket.id} className="ticket-card">
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
                  <button className="delete-btn" onClick={() => deleteTicket(ticket.id)}>Löschen</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </section>

      {showHistory && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setShowHistory(false)}>Schließen</button>
            <h2>Ticket Historie (Alle Tickets)</h2>
            <ul style={{ marginTop: '20px', paddingLeft: '20px' }}>
              {tickets.map(ticket => (
                <li key={ticket.id} style={{ marginBottom: '10px' }}>
                  <strong style={{ color: ticket.is_deleted ? '#d32f2f' : '#4CAF50' }}>
                    [{ticket.is_deleted ? "GELÖSCHT" : ticket.status}]
                  </strong> - {ticket.title} (Kunde: {ticket.customer_name})
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