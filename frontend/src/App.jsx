import { useState, useEffect } from 'react'

function App() {
  const [tickets, setTickets] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [customerName, setCustomerName] = useState('')
  
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [editStatus, setEditStatus] = useState('Offen')
  const [editNotes, setEditNotes] = useState('')
  
  const [showLog, setShowLog] = useState(false)

  useEffect(() => {
    fetch('http://127.0.0.1:3000/tickets')
      .then(response => response.json())
      .then(data => setTickets(data))
      .catch(error => console.error(error))
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault();
    const newTicket = { title, description, customer_name: customerName };

    fetch('http://127.0.0.1:3000/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTicket),
    })
    .then(response => response.json())
    .then(data => {
      setTickets([...tickets, data]); 
      setTitle(''); 
      setDescription(''); 
      setCustomerName(''); 
    })
    .catch(error => console.error(error));
  };

  const openTicket = (ticket) => {
    setSelectedTicket(ticket);
    setEditStatus(ticket.status || 'Offen');
    setEditNotes(ticket.notes || '');
  };

  const handleUpdate = () => {
    fetch(`http://127.0.0.1:3000/tickets/${selectedTicket.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: editStatus, notes: editNotes }),
    })
    .then(response => response.json())
    .then(updatedTicket => {
      setTickets(tickets.map(t => t.id === updatedTicket.id ? updatedTicket : t));
      setSelectedTicket(null);
    })
    .catch(error => console.error(error));
  };

  const handleDelete = () => {
    const isSure = window.confirm("Bist du sicher, dass du dieses Ticket komplett löschen möchtest?");
    if (isSure) {
      fetch(`http://127.0.0.1:3000/tickets/${selectedTicket.id}`, {
        method: 'DELETE',
      })
      .then(response => response.json())
      .then(deletedTicket => {
        setTickets(tickets.map(t => t.id === deletedTicket.id ? deletedTicket : t));
        setSelectedTicket(null); 
      })
      .catch(error => console.error(error));
    }
  };

  const activeTickets = tickets.filter(t => !t.is_deleted);
  
  const ticketsOffen = activeTickets.filter(t => t.status === 'Offen' || !t.status);
  const ticketsInBearbeitung = activeTickets.filter(t => t.status === 'in Bearbeitung');
  const ticketsGeschlossen = activeTickets.filter(t => t.status === 'Geschlossen');

  const renderTicketList = (listTitle, ticketList) => (
    <div style={{ flex: 1, minWidth: '250px', backgroundColor: '#1e1e1e', padding: '15px', borderRadius: '8px' }}>
      <h3 style={{ borderBottom: '1px solid #444', paddingBottom: '10px' }}>{listTitle} ({ticketList.length})</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {ticketList.map(ticket => (
          <li 
            key={ticket.id} 
            onClick={() => openTicket(ticket)}
            style={{ border: '1px solid #444', margin: '10px 0', padding: '15px', borderRadius: '5px', cursor: 'pointer', backgroundColor: '#2a2a2a', transition: '0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#3a3a3a'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2a2a2a'}
          >
            <h4 style={{ margin: '0 0 10px 0' }}>{ticket.title}</h4>
            <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#ffb347' }}>Kunde: {ticket.customer_name || 'Unbekannt'}</p>
            <p style={{ margin: 0, fontSize: '14px', color: '#ccc' }}>
              {ticket.description.substring(0, 40)}{ticket.description.length > 40 ? '...' : ''}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto', color: '#fff', position: 'relative' }}>
      <h1>Helpdesk System</h1>
      
      <button 
        onClick={() => setShowLog(true)}
        style={{ position: 'absolute', top: '25px', right: '20px', padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
      >
        Ticket-Logbuch
      </button>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px', padding: '20px', border: '1px solid #444', borderRadius: '8px', backgroundColor: '#1e1e1e' }}>
        <h3>Neues Ticket erstellen</h3>
        <input 
          type="text" placeholder="Titel (z.B. Internetausfall)" value={title} onChange={(e) => setTitle(e.target.value)} required
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#333', color: 'white' }}
        />
        <input 
          type="text" placeholder="Kundenname / Firma" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#333', color: 'white' }}
        />
        <textarea 
          placeholder="Problembeschreibung..." value={description} onChange={(e) => setDescription(e.target.value)} required
          style={{ padding: '10px', minHeight: '60px', borderRadius: '4px', border: '1px solid #444', fontFamily: 'inherit', backgroundColor: '#333', color: 'white' }}
        />
        <button type="submit" style={{ padding: '10px', cursor: 'pointer', backgroundColor: '#007BFF', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
          Ticket absenden
        </button>
      </form>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {renderTicketList('Offen', ticketsOffen)}
        {renderTicketList('In Bearbeitung', ticketsInBearbeitung)}
        {renderTicketList('Geschlossen', ticketsGeschlossen)}
      </div>

      {selectedTicket && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: '#222', padding: '30px', borderRadius: '8px', maxWidth: '600px', width: '90%', border: '1px solid #555' }}>
            <h2>{selectedTicket.title}</h2>
            <p style={{ color: '#ffb347', marginBottom: '10px', fontWeight: 'bold' }}>Kunde: {selectedTicket.customer_name || 'Unbekannt'}</p>
            <p style={{ color: '#ccc', marginBottom: '20px' }}>{selectedTicket.description}</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontWeight: 'bold' }}>Status ändern:</label>
              <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} style={{ padding: '10px', backgroundColor: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px', fontSize: '16px' }}>
                <option value="Offen">Offen</option>
                <option value="in Bearbeitung">in Bearbeitung</option>
                <option value="Geschlossen">Geschlossen</option>
              </select>

              <label style={{ fontWeight: 'bold', marginTop: '10px' }}>Notizen / Verlauf:</label>
              <textarea 
                value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Hier eintragen, was bereits gemacht wurde..."
                style={{ padding: '10px', minHeight: '120px', backgroundColor: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px', fontFamily: 'inherit' }}
              />

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button onClick={handleUpdate} style={{ flex: 1, padding: '12px', cursor: 'pointer', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>Speichern</button>
                <button onClick={() => setSelectedTicket(null)} style={{ flex: 1, padding: '12px', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>Schließen</button>
                <button onClick={handleDelete} style={{ flex: 1, padding: '12px', cursor: 'pointer', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>Löschen</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLog && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: '#1e1e1e', padding: '30px', borderRadius: '8px', maxWidth: '600px', width: '90%', border: '1px solid #555', maxHeight: '80vh', overflowY: 'auto' }}>
            <h2 style={{ borderBottom: '1px solid #444', paddingBottom: '10px', marginBottom: '20px' }}>Gesamt-Logbuch</h2>
            
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {tickets.map(t => (
                <li key={t.id} style={{ padding: '10px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between' }}>
                  <span>
                    <strong>{t.title}</strong> (Kunde: {t.customer_name || 'Unbekannt'})
                  </span>
                  {t.is_deleted && <span style={{ color: '#dc3545', fontWeight: 'bold', marginLeft: '10px' }}>[GELÖSCHT]</span>}
                </li>
              ))}
            </ul>
            
            <button onClick={() => setShowLog(false)} style={{ width: '100%', marginTop: '20px', padding: '12px', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
              Logbuch schließen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App