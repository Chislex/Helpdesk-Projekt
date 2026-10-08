import { useState, useEffect } from 'react'

function App() {
  const [tickets, setTickets] = useState([])

  // Diese Funktion ruft die Daten von unserem Rust-Backend ab
  useEffect(() => {
    fetch('http://127.0.0.1:3000/tickets')
      .then(response => response.json())
      .then(data => setTickets(data))
      .catch(error => console.error("Fehler beim Laden:", error))
  }, [])

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Helpdesk System</h1>
      
      {tickets.length === 0 ? (
        <p>Lade Tickets oder keine Tickets vorhanden...</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {tickets.map(ticket => (
            <li key={ticket.id} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px', borderRadius: '5px' }}>
              <h3>{ticket.title} <span style={{ fontSize: '12px', color: 'gray' }}>({ticket.status})</span></h3>
              <p>{ticket.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default App