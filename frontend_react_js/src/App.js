import React, { useState, useEffect, useRef } from 'react';
import logo from './logo.svg';
import './App.css';
import { getAITrashTalk } from './openaiTrashTalkService';

// Style constants for both board and chat
const styles = {
  containerFlex: {
    display: "flex",
    flexDirection: "row",
    gap: 32,
    alignItems: "flex-start",
    justifyContent: "center",
    margin: "30px 0 0 0",
    flexWrap: "wrap"
  },
  // GAME BOARD STYLES
  boardPanel: {
    background: "var(--bg-secondary)",
    borderRadius: 15,
    padding: 22,
    minWidth: 290,
    boxShadow: "0 2px 12px rgba(0,0,0,0.09)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 20
  },
  board: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 80px)",
    gridTemplateRows: "repeat(3, 80px)",
    gap: 8,
    background: "var(--bg-primary)",
    borderRadius: 12,
    margin: "14px 0",
    boxShadow: "0 1px 6px rgba(30,65,120,0.02)"
  },
  square: {
    background: "rgba(255,255,255,0.73)",
    color: "#1a1a1a",
    fontWeight: 700,
    fontSize: "2.8rem",
    border: "2.5px solid var(--border-color)",
    borderRadius: 10,
    cursor: "pointer",
    minWidth: 0,
    transition: "background 0.2s, color 0.25s, border 0.16s",
    aspectRatio: "1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  squareDisabled: {
    background: "var(--border-color)",
    color: "var(--text-secondary)",
    cursor: "not-allowed"
  },
  statusMsg: {
    fontSize: 17,
    fontWeight: 500,
    margin: "15px 0 0 0"
  },
  resetBtn: {
    marginTop: 18,
    padding: "8px 20px",
    background: "#ff1744",
    color: "white",
    border: "none",
    borderRadius: 7,
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 15
  },
  scoreboard: {
    margin: "14px 0 0 0",
    display: "flex",
    flexDirection: "row",
    gap: 18,
    fontWeight: 600,
    color: "var(--text-secondary)",
    fontSize: 15,
    justifyContent: "center"
  },
  // CHAT STYLES
  chatPanel: {
    width: '100%',
    maxWidth: 355,
    minWidth: 260,
    margin: "0",
    background: "var(--bg-secondary)",
    borderRadius: 14,
    padding: 18,
    minHeight: 315,
    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column"
  },
  chatMessages: {
    maxHeight: 180,
    overflowY: 'auto',
    marginBottom: 10,
    paddingRight: 6,
    flex: 1
  },
  chatInputRow: {
    display: "flex",
    gap: 8,
    alignItems: "center"
  },
  aiMessage: {
    background: "rgba(30,200,70,0.12)",
    color: "#228a2c",
    borderLeft: "3px solid #33c976",
    borderRadius: "6px",
    padding: "6px 12px",
    margin: "8px 0",
    fontStyle: "italic",
    fontFamily: "inherit"
  },
  humanMessage: {
    background: "rgba(40,90,220,0.06)",
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
    width: "97%", 
    margin: "8px 0 0 0", 
    padding: 7, 
    borderRadius: 6, 
    border: "1.3px solid var(--border-color)"
  }
};

function classNames(...names) { return names.join(" "); }

// Helper - returns winner symbol ("X"/"O") or null, or 'draw'
function calculateWinner(board) {
  // check rows, cols, diags
  for (let i = 0; i < 3; ++i) {
    if (board[i][0] && board[i][0] === board[i][1] && board[i][1] === board[i][2])
      return board[i][0];
    if (board[0][i] && board[0][i] === board[1][i] && board[1][i] === board[2][i])
      return board[0][i];
  }
  // diags
  if (board[0][0] && board[0][0] === board[1][1] && board[0][0] === board[2][2])
    return board[0][0];
  if (board[0][2] && board[0][2] === board[1][1] && board[0][2] === board[2][0])
    return board[0][2];
  // Check for draw (all filled, no winner)
  if (board.flat().every(cell => cell))
    return 'draw';
  return null;
}

// Generate a deep copy of board
function cloneBoard(board) {
  return board.map(row => [...row]);
}

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState('light');
  // Game state
  const [board, setBoard] = useState([
    [null, null, null],
    [null, null, null],
    [null, null, null]
  ]);
  const [xIsNext, setXIsNext] = useState(true); // X always starts (player)
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing', 'won', 'draw'
  const [winner, setWinner] = useState(null); // "X", "O", or null
  const [score, setScore] = useState({ X: 0, O: 0, draw: 0 });
  // Chat state
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Ready to get schooled at Tic Tac Toe?",
      id: Date.now() + '_chat0'
    }
  ]);
  const [isAITyping, setAITyping] = useState(false);
  const [promptCustomize, setPromptCustomize] = useState('');
  const chatEndRef = useRef(null);

  // Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  // Scroll chat to bottom when new chat
  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAITyping]);

  // Handle board click (player move)
  async function handleSquareClick(rowIdx, colIdx) {
    if (gameStatus !== 'playing' || isAITyping) return;
    if (board[rowIdx][colIdx]) return;

    // Player is always "X", AI always "O"
    const nextBoard = cloneBoard(board);
    nextBoard[rowIdx][colIdx] = 'X';

    setBoard(nextBoard);
    setXIsNext(false);

    const winnerNow = calculateWinner(nextBoard);
    if (winnerNow) {
      finishGame(winnerNow, nextBoard);
      await afterMoveChat(nextBoard, 'Player played at (' + (rowIdx+1) + ',' + (colIdx+1) + ').');
      return;
    }

    // AI Move
    setTimeout(() => doAIMove(nextBoard), 730 + Math.random()*600); // make AI less instant
    await afterMoveChat(nextBoard, 'Player played at (' + (rowIdx+1) + ',' + (colIdx+1) + ').');
  }

  // AI selects a random open spot (simple, not unbeatable)
  async function doAIMove(currentBoard) {
    if (gameStatus !== 'playing') return;
    // get open spots
    const empty = [];
    for (let r=0; r<3; ++r) for (let c=0; c<3; ++c)
      if (!currentBoard[r][c]) empty.push([r, c]);
    if (empty.length === 0) return;
    // pick move
    const [row, col] = empty[Math.floor(Math.random()*empty.length)];
    const newBoard = cloneBoard(currentBoard);
    newBoard[row][col] = 'O';
    setBoard(newBoard);
    setXIsNext(true);

    const winnerNow = calculateWinner(newBoard);
    if (winnerNow) {
      finishGame(winnerNow, newBoard);
      await afterMoveChat(newBoard, `AI played at (${row+1},${col+1}).`);
      return;
    }
    await afterMoveChat(newBoard, `AI played at (${row+1},${col+1}).`);
  }

  function finishGame(winnerNow, finalBoard) {
    setGameStatus(winnerNow === "draw" ? "draw" : "won");
    setWinner(winnerNow === "draw" ? null : winnerNow);
    setScore(score => {
      if (winnerNow === "draw") return { ...score, draw: score.draw+1 };
      return { ...score, [winnerNow]: score[winnerNow]+1 };
    });
  }

  // Centralized AI chat after every play event
  async function afterMoveChat(gameStateBoard, eventDesc) {
    setAITyping(true);
    const gameStateForAI = {
      board: gameStateBoard,
      yourSymbol: "X",
      aiSymbol: "O",
      turn: xIsNext ? "ai" : "human"
    };
    try {
      const aiMsg = await getAITrashTalk(gameStateForAI, eventDesc, promptCustomize || undefined);
      setMessages(prev => [...prev, { sender: 'ai', text: aiMsg, id: Date.now() + '_AI' }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'ai', text: `AI error: ${err.message}`, id: Date.now() + '_errchat' }]);
    }
    setAITyping(false);
  }

  // Chat support (player optional text input - not required for main flow)
  const [chatInput, setChatInput] = useState('');
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isAITyping) return;
    setMessages(prev => [...prev, {
      sender: 'human',
      text: chatInput.trim(),
      id: Date.now() + '_usermsg'
    }]);
    setChatInput('');
    await afterMoveChat(board, `Player says: "${chatInput.trim()}"`);
  };

  // Reset board and states for new round
  function handleReset() {
    setBoard([
      [null, null, null],
      [null, null, null],
      [null, null, null]
    ]);
    setXIsNext(true);
    setWinner(null);
    setGameStatus('playing');
  }

  // Theme switch
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // Board Renderer
  function renderSquare(rowIdx, colIdx) {
    const val = board[rowIdx][colIdx];
    let extra = {};
    if (val) extra = styles.squareDisabled;
    if (gameStatus !== 'playing' || isAITyping) extra = styles.squareDisabled;
    return (
      <button
        aria-label={`Square ${rowIdx+1},${colIdx+1} ${val ? 'occupied by ' + val : 'empty'}`}
        style={{ ...styles.square, ...extra }}
        onClick={() => handleSquareClick(rowIdx, colIdx)}
        tabIndex={0}
        disabled={!!val || gameStatus !== "playing" || isAITyping}
        key={`${rowIdx}_${colIdx}`}
      >
        {val === "X" &&
          <span style={{color:'#2163dd'}}>{val}</span>}
        {val === "O" &&
          <span style={{color:'#e87a41'}}>{val}</span>}
        {!val && ""}
      </button>
    );
  }

  // Status message logic
  let statusMsg = "";
  if (gameStatus === 'won') {
    statusMsg = winner === "X" ? "You win! 🎉" : "AI wins! 🤖";
  } else if (gameStatus === 'draw') {
    statusMsg = "It's a draw. Try again!";
  } else {
    statusMsg = xIsNext ? "Your move (X)" : "AI is thinking...";
  }

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
        <img src={logo} className="App-logo" style={{marginBottom: 0}} alt="logo" />
        <h2 style={{margin:"-26px 0 0 0"}}>Trash Talk Tic Tac Toe Arena</h2>
        <div style={{marginTop: 6, fontSize:15, color: "var(--text-secondary)", marginBottom:18}}>
          <span>Play against an AI with playful banter!</span>
        </div>
        {/* Board & Chat side-by-side (on desktop), stacked (mobile) */}
        <div style={styles.containerFlex}>
          <div style={styles.boardPanel}>
            <h3 style={{margin:0, color:"#1976d2", fontWeight:600, letterSpacing:".5px", fontSize: "1.28rem"}}>Game Board</h3>
            <div style={styles.scoreboard}>
              <span>You (X): {score.X}</span>
              <span style={{color:"#e87a41"}}>AI (O): {score.O}</span>
              <span style={{color:"#555"}}>Draws: {score.draw}</span>
            </div>
            <div style={styles.board}>
              {[0,1,2].map(r =>
                [0,1,2].map(c => renderSquare(r,c))
              )}
            </div>
            <div style={styles.statusMsg}>{statusMsg}</div>
            {(gameStatus === "won" || gameStatus === "draw") && (
              <button style={styles.resetBtn} onClick={handleReset}>New Game</button>
            )}
          </div>
          {/* CHAT PANEL */}
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
            {/* Optional: user can send side-chat text */}
            <form style={styles.chatInputRow} onSubmit={sendMessage} autoComplete="off">
              <input
                type="text"
                value={chatInput}
                placeholder="Type and press enter... (optional chat)"
                onChange={e => setChatInput(e.target.value)}
                style={{flex:1, padding:7, borderRadius:6, border: "1px solid var(--border-color)"}}
                aria-label="Enter chat message"
                disabled={isAITyping}
                autoFocus
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
            {/* AI prompt customization */}
            <div>
              <input
                type="text"
                style={styles.promptCustomize}
                placeholder="AI prompt style (optional: personalize, e.g., 'Cocky cowboy...')"
                value={promptCustomize}
                onChange={e => setPromptCustomize(e.target.value)}
                aria-label="Customize AI prompt style"
                disabled={isAITyping}
              />
              <span style={{fontSize:10, color: "var(--text-secondary)"}}>
                (Tip: Change prompt above for a different AI mood/persona!)
              </span>
            </div>
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
