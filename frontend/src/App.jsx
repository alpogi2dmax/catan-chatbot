import { useState, useRef, useEffect } from 'react'
import { formatConvHistory } from './utils/formatConvHistory'
import axios from 'axios'
import './App.css'

function App() {
  const [question, setQuestion] = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [loading, setLoading] = useState(false)

  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory]) 

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!question.trim()) return;

    setLoading(true)

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/chat`,
        {
          question,
          conv_history: formatConvHistory(chatHistory)
        }
      )
      const answer = res.data.answer;
      setChatHistory((prev) => [...prev, question, answer])
      setQuestion('')
    } catch(err) {
      console.error(err)
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto", padding: "1rem" }}>
      <div id='main-container'>
        <h1 style={{ textAlign: "center", marginBottom: "1rem" }}>Catan Chatbot</h1>

        <div id="chat-container">
          {chatHistory.map((msg, i) => (
            <div
              key={i}
              className={`chat-bubble ${i % 2 === 0 ? "chat-human" : "chat-ai"}`}
            >
              {msg}
            </div>
          ))}
          {loading && <p>Loading...</p>}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about Catan..."
          />
          <button type="submit" disabled={loading}>
            Ask
          </button>
        </form>
      </div>
    </div>
  );
    
}

export default App