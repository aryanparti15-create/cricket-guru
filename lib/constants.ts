export const TEAMS = [
  { short: 'CSK', full: 'Chennai Super Kings', color: '#c9a800', text: '#000' },
  { short: 'MI', full: 'Mumbai Indians', color: '#004BA0', text: '#fff' },
  { short: 'RCB', full: 'Royal Challengers Bengaluru', color: '#C8102E', text: '#fff' },
  { short: 'KKR', full: 'Kolkata Knight Riders', color: '#3A225D', text: '#D4AF37' },
  { short: 'DC', full: 'Delhi Capitals', color: '#0078BC', text: '#fff' },
  { short: 'RR', full: 'Rajasthan Royals', color: '#EA1A85', text: '#fff' },
  { short: 'SRH', full: 'Sunrisers Hyderabad', color: '#FF6600', text: '#000' },
  { short: 'PBKS', full: 'Punjab Kings', color: '#ED1B24', text: '#fff' },
  { short: 'GT', full: 'Gujarat Titans', color: '#0B4EA2', text: '#fff' },
  { short: 'LSG', full: 'Lucknow Super Giants', color: '#A72B2A', text: '#FFCC00' },
]

export const getTeamColor = (shortName: string) => {
  const t = TEAMS.find(t => t.short.toLowerCase() === shortName?.toLowerCase())
  return t || { color: '#2a2a3a', text: '#fff', short: shortName, full: shortName }
}

export const BALL_STYLES: Record<string, { bg: string; color: string }> = {
  W:  { bg: '#ff2244', color: '#fff' },
  '6': { bg: '#00e676', color: '#000' },
  '4': { bg: '#40c4ff', color: '#000' },
  '0': { bg: '#1a1a2e', color: '#444' },
  '•': { bg: '#1a1a2e', color: '#444' },
  wb: { bg: '#ff9800', color: '#000' },
  nb: { bg: '#ff9800', color: '#000' },
}
export const getBallStyle = (b: string) =>
  BALL_STYLES[b] || { bg: '#ffd740', color: '#000' }

export const SESSION_TYPES = [
  'Over Run',
  'Match Run',
  'Wicket Session',
  'Partnership Run',
  'Powerplay Score',
  'Death Over Run',
]

export const OVER_TARGETS = [4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,20]

export const QUICK_PROMPTS = [
  { label: 'YES or NO? 🎯', q: 'Give me a sharp YES or NO decision for this session with full reasoning.' },
  { label: 'Momentum 🔥', q: 'Analyze the current match momentum based on last balls and situation.' },
  { label: 'Pitch angle 📊', q: 'How is the pitch playing and how should it affect the next few overs?' },
  { label: 'Batsman form', q: 'Analyze the current batsmen — are they set or still getting in?' },
  { label: 'Over prediction', q: 'How many runs do you predict in the next over? Give a range with reasoning.' },
  { label: 'Best bet 💰', q: 'Looking at all factors — pitch, momentum, form, odds — what is your strongest call right now?' },
]
