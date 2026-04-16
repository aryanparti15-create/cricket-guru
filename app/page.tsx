'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MatchData, ChatMessage } from '@/lib/types'
import { buildContext } from '@/lib/buildContext'
import { getTeamColor, getBallStyle, SESSION_TYPES, OVER_TARGETS, QUICK_PROMPTS } from '@/lib/constants'

export default function CricketGuru() {
  const [match, setMatch] = useState<MatchData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [chat, setChat] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('chat')
  const [sessionOdds, setSessionOdds] = useState({ yes: 65, no: 35 })
  const [overTarget, setOverTarget] = useState(8)
  const [sessionType, setSessionType] = useState('Over Run')
  const [players, setPlayers] = useState({
    batsman1: '', b1runs: '', b1balls: '',
    batsman2: '', b2runs: '', b2balls: '',
    bowler: '', bowlerFig: ''
  })
  const [lastBalls, setLastBalls] = useState<string[]>([])
  const chatEndRef = useRef<HTMLDivElement>(null)
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat])

  const fetchScore = useCallback(async (silent: boolean) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/score')
      const data = await res.json()
      if (data.found) {
        setMatch((prev) => ({
          ...data,
          batsman1: prev?.batsman1 ?? '',
          b1runs: prev?.b1runs ?? '',
          b1balls: prev?.b1balls ?? '',
          batsman2: prev?.batsman2 ?? '',
          b2runs: prev?.b2runs ?? '',
          b2balls: prev?.b2balls ?? '',
          bowler: prev?.bowler ?? '',
          bowlerFig: prev?.bowlerFig ?? '',
          lastBalls: prev?.lastBalls ?? [],
        }))
        setLastRefresh(new Date())
        if (!silent) {
          setChat([{
            role: 'ai',
            text: `🏏 Live match loaded!\n\n${data.team1Full} vs ${data.team2Full}\n📍 ${data.venue}\n\n${data.matchStatus}\nScore: ${data.score} in ${data.overs}.${data.balls} overs | CRR: ${data.crr}${data.rrr ? ' | RRR: ' + data.rrr : ''}\n\n📊 Pitch: ${data.pitch}\n\nUpdate batsmen in Score tab, then ask me anything — YES/NO calls, momentum, over predictions! 🔥`
          }])
        }
      } else {
        setError(data.error || 'No live IPL match found right now.')
      }
    } catch {
      setError('Failed to fetch. Check your API key or connection.')
    }
    if (!silent) setLoading(false)
  }, [])

  useEffect(() => {
    if (match) {
      refreshRef.current = setInterval(() => fetchScore(true), 45000)
    }
    return () => {
      if (refreshRef.current) clearInterval(refreshRef.current)
    }
  }, [match, fetchScore])

  const getMatchWithPlayers = (): MatchData | null => {
    if (!match) return null
    return { ...match, ...players, lastBalls }
  }

  const askAI = async (userMsg: string) => {
    const m = getMatchWithPlayers()
    if (!m || aiLoading || !userMsg.trim()) return
    setAiLoading(true)
    const newChat: ChatMessage[] = [...chat, { role: 'user', text: userMsg }]
    setChat(newChat)
    setInput('')
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: buildContext(m, sessionType, overTarget, sessionOdds),
          messages: newChat.map((c) => ({
            role: c.role === 'user' ? 'user' : 'assistant',
            content: c.text,
          })),
        }),
      })
      const data = await res.json()
      setChat([...newChat, { role: 'ai', text: data.reply || data.error || 'Error.' }])
    } catch {
      setChat([...newChat, { role: 'ai', text: 'Connection error.' }])
    }
    setAiLoading(false)
  }

  const addBall = (b: string) => {
    const newBalls = [...lastBalls, b]
    setLastBalls(newBalls)
    if (!match) return
    let { runs, wickets, overs, balls } = match
    if (b === 'W') { wickets = Math.min(10, wickets + 1); balls++ }
    else if (b === 'wb' || b === 'nb') { runs++ }
    else { runs += parseInt(b) || 0; balls++ }
    if (balls >= 6) { overs++; balls = 0 }
    const total = overs + balls / 6
    const crr = total > 0 ? ((runs / total) * 6).toFixed(2) : '0.00'
    let rrr = match.rrr
    if (match.target) {
      const bl = (20 - overs) * 6 - balls
      rrr = bl > 0 ? (((match.target - runs) / bl) * 6).toFixed(2) : null
    }
    setMatch((prev) =>
      prev ? { ...prev, runs, wickets, overs, balls, score: `${runs}/${wickets}`, crr, rrr, lastBalls: newBalls } : null
    )
  }

  const tc1 = match ? getTeamColor(match.team1) : null
  const tc2 = match ? getTeamColor(match.team2) : null

  const cardStyle: React.CSSProperties = {
    background: '#090916', border: '1px solid #0e0e1e',
    borderRadius: 12, padding: 12, marginBottom: 10,
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 10, color: '#444', letterSpacing: 1,
    display: 'block', marginBottom: 5,
  }
  const inputStyle: React.CSSProperties = {
    background: '#0e0e1c', color: '#fff', border: '1px solid #1a1a2e',
    borderRadius: 8, padding: '7px 10px',
    fontFamily: "'Rajdhani',sans-serif", fontSize: 13, width: '100%',
  }
  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '8px 4px', background: 'none', border: 'none',
    color: active ? '#ffd740' : '#2a2a3a', fontSize: 11,
    fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, letterSpacing: 0.5,
    borderBottom: `2px solid ${active ? '#ffd740' : 'transparent'}`,
    cursor: 'pointer', textTransform: 'uppercase',
  })

  return (
    <div style={{ height: '100vh', background: '#06060f', color: '#fff', display: 'flex', flexDirection: 'column', maxWidth: 500, margin: '0 auto', overflow: 'hidden', fontFamily: "'Rajdhani',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@700;900&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#ffd740;border-radius:2px}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.2}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .msg{animation:slideUp .2s ease forwards}
        .qbtn:hover{color:#ffd740!important;border-color:rgba(255,215,64,.4)!important}
        .ball:active{transform:scale(.88)}
        textarea:focus,input:focus{outline:none}
        select{background:#0e0e1c;color:#fff;border:1px solid #1a1a2e;border-radius:8px;padding:6px 10px;font-family:'Rajdhani',sans-serif;font-size:13px}
      `}</style>

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(180deg,#0c0c1e,#06060f)', borderBottom: '1px solid #0e0e1e', padding: '8px 14px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: match ? 8 : 0 }}>
          <div>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 14, color: '#ffd740', letterSpacing: 2 }}>🏏 CRICKET GURU</div>
            <div style={{ fontSize: 9, color: '#222', marginTop: 1 }}>IPL AI Session Analyst</div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {match && (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e676', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 9, color: '#00e676', fontFamily: "'Orbitron',sans-serif", fontWeight: 700 }}>LIVE</span>
              </div>
            )}
            <button onClick={() => fetchScore(false)} disabled={loading}
              style={{ background: 'rgba(255,215,64,.07)', border: '1px solid rgba(255,215,64,.2)', borderRadius: 7, padding: '5px 11px', color: '#ffd740', fontSize: 11, fontFamily: "'Rajdhani',sans-serif", fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
              <span style={{ display: 'inline-block', animation: loading ? 'spin .8s linear infinite' : 'none', fontSize: 14 }}>↻</span>
              {loading ? 'Loading...' : match ? 'Refresh' : '🔍 Fetch Live'}
            </button>
          </div>
        </div>

        {loading && !match && (
          <div style={{ background: '#080816', border: '1px solid #0e0e1e', borderRadius: 12, padding: 18, textAlign: 'center', marginTop: 8 }}>
            <div style={{ fontSize: 26, animation: 'pulse 1s infinite', marginBottom: 6 }}>📡</div>
            <div style={{ color: '#ffd740', fontSize: 13, fontWeight: 700 }}>Fetching live IPL score...</div>
          </div>
        )}
        {error && !loading && (
          <div style={{ background: 'rgba(255,34,68,.06)', border: '1px solid rgba(255,34,68,.2)', borderRadius: 12, padding: 14, textAlign: 'center', marginTop: 8 }}>
            <div style={{ color: '#ff6680', fontSize: 13, marginBottom: 8 }}>{error}</div>
            <button onClick={() => fetchScore(false)} style={{ background: 'rgba(255,34,68,.15)', border: '1px solid rgba(255,34,68,.3)', borderRadius: 7, padding: '5px 16px', color: '#ff6680', fontFamily: "'Rajdhani',sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Retry</button>
          </div>
        )}
        {!match && !loading && !error && (
          <div style={{ background: '#080816', border: '1px dashed #111128', borderRadius: 12, padding: 18, textAlign: 'center', marginTop: 8 }}>
            <div style={{ fontSize: 30, marginBottom: 8 }}>🏏</div>
            <div style={{ color: '#444', fontSize: 13 }}>Tap &quot;Fetch Live&quot; to auto-load the current IPL match score</div>
          </div>
        )}

        {match && tc1 && tc2 && (
          <>
            <div style={{ background: '#080816', border: '1px solid #0e0e1e', borderRadius: 12, padding: '8px 12px', marginBottom: 7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ display: 'inline-block', background: tc1.color, color: tc1.text, borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 700, marginBottom: 2 }}>{match.team1}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Orbitron',sans-serif", color: match.innings === 1 ? '#ffd740' : '#333' }}>
                    {match.innings === 1 ? match.score : (match.team1Score != null ? `${match.team1Score}/${match.team1Wickets}` : '–')}
                  </div>
                </div>
                <div style={{ textAlign: 'center', padding: '0 6px' }}>
                  <div style={{ fontSize: 9, color: '#1e1e28' }}>OV {match.overs}.{match.balls}</div>
                  <div style={{ fontSize: 9, color: '#1a1a28' }}>VS</div>
                  <div style={{ fontSize: 9, color: '#00e676' }}>CRR {match.crr}</div>
                  {match.rrr && <div style={{ fontSize: 9, color: '#ff6060' }}>RRR {match.rrr}</div>}
                  {match.target && <div style={{ fontSize: 9, color: '#ffd740' }}>TGT {match.target}</div>}
                </div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ display: 'inline-block', background: tc2.color, color: tc2.text, borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 700, marginBottom: 2 }}>{match.team2}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Orbitron',sans-serif", color: match.innings === 2 ? '#ffd740' : '#333' }}>
                    {match.innings === 2 ? match.score : '–'}
                  </div>
                </div>
              </div>
              {(players.batsman1 || players.batsman2) && (
                <div style={{ background: '#060612', borderRadius: 7, padding: '4px 8px', marginBottom: 4, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  {players.batsman1 && <span><span style={{ color: '#ffd740' }}>🏏 {players.batsman1}</span> <span style={{ color: '#555' }}>{players.b1runs}*({players.b1balls})</span></span>}
                  {players.batsman2 && <span><span style={{ color: '#bbb' }}>{players.batsman2}</span> <span style={{ color: '#444' }}>{players.b2runs}({players.b2balls})</span></span>}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {players.bowler && <div style={{ fontSize: 10, color: '#333' }}>🎳 <span style={{ color: '#444' }}>{players.bowler}</span> <span style={{ color: '#333' }}>{players.bowlerFig}</span></div>}
                <div style={{ display: 'flex', gap: 3, marginLeft: 'auto' }}>
                  {lastBalls.slice(-10).map((b, i) => {
                    const bs = getBallStyle(b)
                    return <div key={i} style={{ width: 17, height: 17, borderRadius: '50%', background: bs.bg, color: bs.color, fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{b}</div>
                  })}
                </div>
              </div>
              {lastRefresh && <div style={{ fontSize: 9, color: '#1e1e28', textAlign: 'right', marginTop: 3 }}>↻ {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · auto 45s</div>}
            </div>

            <div style={{ background: 'linear-gradient(135deg,#07051a,#060c18)', border: '1px solid #100c28', borderRadius: 11, padding: '8px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: '#7755aa' }}>SESSION: <strong style={{ color: '#aa77ff' }}>{sessionType}</strong></span>
                <span style={{ fontSize: 11, color: '#ffd740', fontWeight: 700 }}>Ov {match.overs + 1}: {overTarget}+ runs</span>
              </div>
              <div style={{ display: 'flex', gap: 7 }}>
                <div style={{ flex: 1, background: 'rgba(0,230,118,.08)', border: '1px solid rgba(0,230,118,.18)', borderRadius: 7, padding: '5px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: '#00e676', fontWeight: 600 }}>YES</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#00e676', fontFamily: "'Orbitron',sans-serif" }}>{sessionOdds.yes}%</div>
                </div>
                <div style={{ flex: 1, background: 'rgba(255,34,68,.08)', border: '1px solid rgba(255,34,68,.18)', borderRadius: 7, padding: '5px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: '#ff3355', fontWeight: 600 }}>NO</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#ff3355', fontFamily: "'Orbitron',sans-serif" }}>{sessionOdds.no}%</div>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('chat')
                    askAI(`Quick call! ${match.team1} vs ${match.team2}, ${match.score} in ${match.overs}.${match.balls} overs, CRR ${match.crr}${match.rrr ? ' RRR ' + match.rrr : ''}. SESSION ${sessionType}: Over ${match.overs + 1} target ${overTarget}+ runs, odds YES ${sessionOdds.yes}% NO ${sessionOdds.no}%. YES or NO and why?`)
                  }}
                  style={{ flex: 1, background: 'linear-gradient(135deg,#ffd740,#ff8f00)', border: 'none', borderRadius: 7, padding: '5px', fontFamily: "'Orbitron',sans-serif", fontSize: 10, fontWeight: 900, color: '#000', lineHeight: 1.3, cursor: 'pointer' }}>
                  ASK<br />GURU
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', borderBottom: '1px solid #0c0c1a', flexShrink: 0 }}>
        {[['chat', '🤖 AI Chat'], ['score', '📊 Score'], ['session', '⚡ Session']].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)} style={tabStyle(activeTab === key)}>{label}</button>
        ))}
      </div>

      {/* AI CHAT */}
      {activeTab === 'chat' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 9 }}>
            {chat.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🏏</div>
                <div style={{ color: '#222', fontSize: 13 }}>Fetch a live match to start</div>
              </div>
            )}
            {chat.map((m, i) => (
              <div key={i} className="msg" style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.role === 'ai' && (
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#ffd740,#ff8f00)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, marginRight: 7, flexShrink: 0, marginTop: 2 }}>🏏</div>
                )}
                <div style={{ maxWidth: '83%', background: m.role === 'user' ? 'linear-gradient(135deg,#0b1c34,#060e1c)' : '#090916', border: `1px solid ${m.role === 'user' ? '#112442' : '#0e0e1e'}`, borderRadius: m.role === 'user' ? '13px 13px 3px 13px' : '13px 13px 13px 3px', padding: '8px 12px', fontSize: 14, lineHeight: 1.55, color: m.role === 'user' ? '#6699dd' : '#ccc', whiteSpace: 'pre-wrap' }}>
                  {m.text}
                </div>
              </div>
            ))}
            {aiLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#ffd740,#ff8f00)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>🏏</div>
                <div style={{ background: '#090916', border: '1px solid #0e0e1e', borderRadius: '13px 13px 13px 3px', padding: '9px 13px', display: 'flex', gap: 4 }}>
                  {[0, 1, 2].map((j) => <div key={j} style={{ width: 6, height: 6, borderRadius: '50%', background: '#ffd740', animation: `pulse 1s ${j * 0.2}s infinite` }} />)}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          {match && (
            <div style={{ padding: '5px 14px', display: 'flex', gap: 5, overflowX: 'auto', flexShrink: 0 }}>
              {QUICK_PROMPTS.map(({ label, q }) => (
                <button key={label} className="qbtn" onClick={() => askAI(q)}
                  style={{ background: '#090916', border: '1px solid #0e0e1e', borderRadius: 20, padding: '4px 11px', color: '#2a2a3a', fontSize: 11, whiteSpace: 'nowrap', fontFamily: "'Rajdhani',sans-serif", fontWeight: 600, transition: 'all .2s', flexShrink: 0, cursor: 'pointer' }}>
                  {label}
                </button>
              ))}
            </div>
          )}
          <div style={{ padding: '8px 14px', borderTop: '1px solid #0c0c1a', display: 'flex', gap: 7, flexShrink: 0 }}>
            <textarea value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (input.trim() && !aiLoading && match) askAI(input) } }}
              placeholder={match ? 'Ask Guru anything...' : 'Fetch live match first...'}
              disabled={!match}
              style={{ flex: 1, background: '#090916', border: '1px solid #0e0e1e', borderRadius: 11, padding: '9px 12px', color: '#fff', fontSize: 14, fontFamily: "'Rajdhani',sans-serif", minHeight: 40, maxHeight: 80, resize: 'none', opacity: match ? 1 : 0.3 }}
              rows={1} />
            <button onClick={() => { if (input.trim() && !aiLoading && match) askAI(input) }}
              disabled={aiLoading || !input.trim() || !match}
              style={{ background: (aiLoading || !match || !input.trim()) ? '#0e0e1c' : 'linear-gradient(135deg,#ffd740,#ff8f00)', border: 'none', borderRadius: 11, padding: '9px 14px', fontSize: 17, opacity: (!input.trim() || !match) ? 0.3 : 1, transition: 'all .2s', cursor: 'pointer' }}>
              {aiLoading ? '⏳' : '→'}
            </button>
          </div>
        </div>
      )}

      {/* SCORE UPDATE */}
      {activeTab === 'score' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 10, color: '#444', letterSpacing: 1, marginBottom: 9 }}>BALL BY BALL</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              {['0', '1', '2', '3', '4', '6', 'W', 'wb', 'nb'].map((b) => {
                const bs = getBallStyle(b)
                return (
                  <button key={b} className="ball" onClick={() => addBall(b)}
                    style={{ width: b === 'wb' || b === 'nb' ? 40 : 34, height: 34, borderRadius: '50%', background: bs.bg, border: 'none', color: bs.color, fontSize: b === 'wb' || b === 'nb' ? 9 : 13, fontWeight: 700, transition: 'transform .1s', fontFamily: "'Rajdhani',sans-serif", cursor: 'pointer' }}>
                    {b}
                  </button>
                )
              })}
            </div>
            <button onClick={() => setLastBalls((p) => p.slice(0, -1))}
              style={{ background: 'rgba(255,34,68,.08)', border: '1px solid rgba(255,34,68,.2)', borderRadius: 7, padding: '4px 12px', color: '#ff4466', fontSize: 12, fontFamily: "'Rajdhani',sans-serif", cursor: 'pointer' }}>
              ← Undo
            </button>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 10, color: '#444', letterSpacing: 1, marginBottom: 9 }}>PLAYERS AT CREASE</div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 6, marginBottom: 7 }}>
              <div><label style={labelStyle}>Batsman 1</label><input style={inputStyle} placeholder="Name" value={players.batsman1} onChange={(e) => setPlayers((p) => ({ ...p, batsman1: e.target.value }))} /></div>
              <div><label style={labelStyle}>Runs*</label><input style={inputStyle} type="number" placeholder="0" value={players.b1runs} onChange={(e) => setPlayers((p) => ({ ...p, b1runs: e.target.value }))} /></div>
              <div><label style={labelStyle}>Balls</label><input style={inputStyle} type="number" placeholder="0" value={players.b1balls} onChange={(e) => setPlayers((p) => ({ ...p, b1balls: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 6, marginBottom: 7 }}>
              <div><label style={labelStyle}>Batsman 2</label><input style={inputStyle} placeholder="Name" value={players.batsman2} onChange={(e) => setPlayers((p) => ({ ...p, batsman2: e.target.value }))} /></div>
              <div><label style={labelStyle}>Runs</label><input style={inputStyle} type="number" placeholder="0" value={players.b2runs} onChange={(e) => setPlayers((p) => ({ ...p, b2runs: e.target.value }))} /></div>
              <div><label style={labelStyle}>Balls</label><input style={inputStyle} type="number" placeholder="0" value={players.b2balls} onChange={(e) => setPlayers((p) => ({ ...p, b2balls: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 6 }}>
              <div><label style={labelStyle}>Bowler</label><input style={inputStyle} placeholder="Name" value={players.bowler} onChange={(e) => setPlayers((p) => ({ ...p, bowler: e.target.value }))} /></div>
              <div><label style={labelStyle}>Figures</label><input style={inputStyle} placeholder="0/14 (2)" value={players.bowlerFig} onChange={(e) => setPlayers((p) => ({ ...p, bowlerFig: e.target.value }))} /></div>
            </div>
          </div>
          <button onClick={() => { setActiveTab('chat'); askAI('Score updated. Give me a fresh analysis — current situation, momentum, and your session call.') }}
            style={{ width: '100%', background: match ? 'linear-gradient(135deg,#ffd740,#ff8f00)' : '#1a1a2e', border: 'none', borderRadius: 11, padding: 13, fontSize: 15, fontFamily: "'Orbitron',sans-serif", fontWeight: 700, color: match ? '#000' : '#333', letterSpacing: 1, opacity: match ? 1 : 0.4, cursor: match ? 'pointer' : 'default' }}
            disabled={!match}>
            🔍 ANALYZE NOW
          </button>
        </div>
      )}

      {/* SESSION CONFIG */}
      {activeTab === 'session' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 10, color: '#444', letterSpacing: 1, marginBottom: 9 }}>SESSION TYPE</div>
            {SESSION_TYPES.map((t) => (
              <button key={t} onClick={() => setSessionType(t)}
                style={{ display: 'block', width: '100%', background: sessionType === t ? 'rgba(255,215,64,.06)' : 'transparent', border: `1px solid ${sessionType === t ? 'rgba(255,215,64,.3)' : '#0e0e1e'}`, borderRadius: 7, padding: '8px 12px', color: sessionType === t ? '#ffd740' : '#333', marginBottom: 5, textAlign: 'left', fontFamily: "'Rajdhani',sans-serif", fontSize: 14, fontWeight: sessionType === t ? 700 : 500, cursor: 'pointer' }}>
                {sessionType === t ? '✓  ' : '    '}{t}
              </button>
            ))}
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 10, color: '#444', letterSpacing: 1, marginBottom: 9 }}>OVER TARGET (runs)</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {OVER_TARGETS.map((n) => (
                <button key={n} onClick={() => setOverTarget(n)}
                  style={{ width: 36, height: 36, borderRadius: 7, background: overTarget === n ? 'linear-gradient(135deg,#ffd740,#ff8f00)' : '#0c0c1a', border: `1px solid ${overTarget === n ? '#ffd740' : '#111128'}`, color: overTarget === n ? '#000' : '#2a2a3a', fontWeight: 700, fontSize: 13, fontFamily: "'Rajdhani',sans-serif", transition: 'all .15s', cursor: 'pointer' }}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 10, color: '#444', letterSpacing: 1, marginBottom: 9 }}>ODDS</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: '#00e676', marginBottom: 5 }}>YES %</div>
                <input type="number" min="1" max="99" value={sessionOdds.yes}
                  onChange={(e) => { const v = Math.min(99, Math.max(1, parseInt(e.target.value) || 50)); setSessionOdds({ yes: v, no: 100 - v }) }}
                  style={{ background: '#0c0c1a', border: '1px solid #0a2a14', borderRadius: 8, padding: 9, color: '#00e676', fontSize: 22, fontFamily: "'Orbitron',sans-serif", fontWeight: 700, textAlign: 'center', width: '100%' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: '#ff3355', marginBottom: 5 }}>NO %</div>
                <input type="number" min="1" max="99" value={sessionOdds.no}
                  onChange={(e) => { const v = Math.min(99, Math.max(1, parseInt(e.target.value) || 50)); setSessionOdds({ yes: 100 - v, no: v }) }}
                  style={{ background: '#0c0c1a', border: '1px solid #2a0a0e', borderRadius: 8, padding: 9, color: '#ff3355', fontSize: 22, fontFamily: "'Orbitron',sans-serif", fontWeight: 700, textAlign: 'center', width: '100%' }} />
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setActiveTab('chat')
              if (match) askAI(`Full verdict. ${match.team1} vs ${match.team2}, ${match.score} in ${match.overs}.${match.balls} overs, CRR ${match.crr}${match.rrr ? ' RRR ' + match.rrr : ''}. ${players.batsman1} ${players.b1runs}*(${players.b1balls}), ${players.batsman2} ${players.b2runs}(${players.b2balls}). ${players.bowler} ${players.bowlerFig}. Last: ${lastBalls.slice(-8).join(' ')}. SESSION: ${sessionType}, Over ${match.overs + 1} target ${overTarget}+ runs. Odds YES ${sessionOdds.yes}% NO ${sessionOdds.no}%. Full breakdown then final YES or NO.`)
            }}
            style={{ width: '100%', background: match ? 'linear-gradient(135deg,#5b21b6,#3b0f8c)' : '#1a1a2e', border: '1px solid rgba(120,80,220,.3)', borderRadius: 11, padding: 13, fontSize: 15, fontFamily: "'Orbitron',sans-serif", fontWeight: 700, color: '#fff', letterSpacing: 1, opacity: match ? 1 : 0.4, cursor: match ? 'pointer' : 'default' }}
            disabled={!match}>
            🔮 GET FULL AI VERDICT
          </button>
        </div>
      )}
    </div>
  )
}
