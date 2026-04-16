export interface MatchData {
  found: boolean
  matchId?: string
  team1: string
  team2: string
  team1Full: string
  team2Full: string
  venue: string
  pitch: string
  innings: number
  battingTeam: string
  score: string
  runs: number
  wickets: number
  overs: number
  balls: number
  crr: string
  target: number | null
  rrr: string | null
  team1Score: number | null
  team1Wickets: number | null
  toss: string
  matchStatus: string
  lastUpdated: string
  // manually entered player data
  batsman1?: string
  b1runs?: string
  b1balls?: string
  batsman2?: string
  b2runs?: string
  b2balls?: string
  bowler?: string
  bowlerFig?: string
  lastBalls?: string[]
}

export interface ChatMessage {
  role: 'user' | 'ai'
  text: string
}
