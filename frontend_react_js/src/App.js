import React, { useState, useEffect, useRef } from 'react';
import logo from './logo.svg';
import './App.css';
import { getAITrashTalk } from './openaiTrashTalkService';

// Simple chat/message container styles (basic, add/adjust in App.css as needed)
const styles = {
  chatPanel: {
    width: '100%',
    maxWidth: 460,
    margin: "24px auto 0 auto",
    background: "var(--bg-secondary)",
    borderRadius: 14,
    padding: 18,
    minHeight: 310,
    boxShadow: "0 2px 12px rgba(0,0,0,0.05)"
  },
  chatMessages: {
    maxHeight: 220,
    overflowY: 'auto',
    marginBottom: 10,
    paddingRight: 6,
  },
  chatInputRow: {
    display: "flex",
    gap: 8,
    alignItems: "center"
  },
  aiMessage: {
    background: "rgba(30,200,70,0.1)",
    color: "#228a2c",
    borderLeft: "3px solid #33c976",
    borderRadius: "6px",
    padding: "6px 12px",
    margin: "8px 0",
    fontStyle: "italic",
    fontFamily: "inherit"
  },
  humanMessage: {
    background: "rgba(0,80,200,0.04)",
    color: "var(--text-primary)",
    borderRadius: "6px",
    padding: "6px 12px",
    margin: "8px 0"
  },
  sender: {
    fontWeight: 500,
    fontSize: 13,
    marginRight: 8,
    color: "var(--text-secondary)"
  },
  promptCustomize: {
    width: "95%", 
    margin: "8px 0 0 0", 
    padding: 7, 
    borderRadius: 6, 
    border: "1.3px solid var(--border-color)"
  }
};

// Trash talk demo context (replace/extend with real game state)
const demoGameState = { 
  board: [ [null, null, null], [null, null, null], [null, null, null] ],
  yourSymbol: "X",
  aiSymbol: "O",
  turn: "human"
};

function classNames(...names) { return names.join(" "); }

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState('light');
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Ready to get schooled at Tic Tac Toe?",
      id: Date.now() + '_0'
    }
  ]);
  const [input, setInput] = useState('');
  const [isAITyping, setAITyping] = useState(false);
  const [promptCustomize, setPromptCustomize] = useState('');
  const chatEndRef = useRef(null);

  // Effect to apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // Scroll to bottom when new message
  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAITyping]);

  // Handle sending chat (player message)
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const msgObj = {
      sender: 'human',
      text: input.trim(),
      id: Date.now() + '_user'
    };
    setMessages(prev => [...prev, msgObj]);
    setInput('');

    // After player submits, simulate a game event (customize as needed)
    await handleAITurn({
      gameState: demoGameState,
      lastEvent: `Player says: "${msgObj.text}"`
    });
  };

  // PUBLIC_INTERFACE
  async function handleAITurn({ gameState, lastEvent }) {
    setAITyping(true);

    try {
      const aiMsg = await getAITrashTalk(gameState, lastEvent, promptCustomize || undefined);
      setMessages(prev => [
        ...prev,
        { sender: 'ai', text: aiMsg, id: Date.now() + '_ai' }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { sender: 'ai', text: `AI error: ${err.message}`, id: Date.now() + '_ai_error' }
      ]);
    }
    setAITyping(false);
  }

  // Simulate a board move (for demo)
  const simulateMove = async () => {
    await handleAITurn({
      gameState: demoGameState,
      lastEvent: "Player X made a move at (1,2)."
    });
  };

  // PUBLIC_INTERFACE
  // Customization documentation is shown inline and in openaiTrashTalkService.js

  return (
    <div className="App">
      <header className="App-header">
        <button 
          className="theme-toggle" 
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
        <img src={logo} className="App-logo" alt="logo" />
        <h2>Trash Talk Tic Tac Toe Arena</h2>
        <div style={{marginTop: 8, fontSize:15, color: "var(--text-secondary)"}}>
          <span>Let AI spice up your match with playful banter!</span>
        </div>
        <div style={styles.chatPanel}>
          <div style={styles.chatMessages} aria-live="polite">
            {messages.map(msg =>
              <div
                key={msg.id}
                style={msg.sender === 'ai' ? styles.aiMessage : styles.humanMessage}
                className={classNames("chat-bubble", msg.sender === 'ai' ? "ai" : "human")}
              >
                <span style={styles.sender}>
                  {msg.sender === 'ai' ? "🤖 AI" : "🧑 You"}
                </span>
                <span>{msg.text}</span>
              </div>
            )}
            {isAITyping && <div style={styles.aiMessage}><span style={styles.sender}>🤖 AI typing...</span></div>}
            <div ref={chatEndRef} />
          </div>
          <form style={styles.chatInputRow} onSubmit={sendMessage}>
            <input
              type="text"
              value={input}
              placeholder="Type and press enter..."
              onChange={e => setInput(e.target.value)}
              style={{flex:1, padding:7, borderRadius:6, border: "1px solid var(--border-color)"}}
              aria-label="Enter chat message"
              autoFocus
              disabled={isAITyping}
            />
            <button
              type="submit"
              style={{
                background: "var(--button-bg)",
                color: "var(--button-text)",
                border: "none",
                borderRadius: 7,
                padding: "7px 16px",
                fontWeight: 600,
                cursor: isAITyping ? "not-allowed" : "pointer"
              }}
              disabled={isAITyping}
            >
              Send
            </button>
          </form>
          <button
            style={{
              marginTop: 6,
              background: "#ff1744",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "4px 13px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: isAITyping ? "not-allowed" : "pointer"
            }}
            disabled={isAITyping}
            onClick={simulateMove}
            type="button"
            title="Trigger AI trash talk (demo move)"
          >
            Simulate AI Trash Talk
          </button>
          <div>
            <input
              type="text"
              style={styles.promptCustomize}
              placeholder="AI prompt style (optional: personalize, e.g., 'Be like a cowboy...')"
              value={promptCustomize}
              onChange={e => setPromptCustomize(e.target.value)}
              aria-label="Customize AI prompt style"
              disabled={isAITyping}
            />
            <span style={{fontSize:10, color: "var(--text-secondary)"}}>
              (Tip: Change the prompt above to make AI reply with your preferred style!)
            </span>
          </div>
        </div>
        <p style={{ marginTop: 22, fontSize:13 }}>
          Current theme: <strong>{theme}</strong>
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
