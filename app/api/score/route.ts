import { NextRequest, NextResponse } from 'next/server'

const CRICAPI_KEY = process.env.CRICAPI_KEY || ''

// Venue pitch notes
const PITCH_NOTES: Record<string, string> = {
  chepauk: 'Slow turner. Spinners deadly after 10 overs. Dew helps batters at night. Avg ~165.',
  chidambaram: 'Slow turner. Spinners deadly after 10 overs. Dew helps batters at night. Avg ~165.',
  wankhede: 'Hard bouncy track. Batters dominate. Sea breeze helps pacers. Avg ~185.',
  chinnaswamy: 'Flat batting paradise. Tiny ground, sixes fly. Avg ~190.',
  'eden gardens': 'Balanced pitch. Early seam movement then batter-friendly. Avg ~170.',
  'arun jaitley': 'Flat Delhi deck. Dew heavily affects night games. Avg ~175.',
  'rajiv gandhi': 'Good batting surface. Pace gets bounce. Avg ~175.',
  ekana: 'Sporting wicket. Helps seamers early, good for chasing.',
  'narendra modi': 'Flat true pitch. Batters excel. Large ground limits sixes.',
}

function getPitch(venue: string) {
  const v = venue.toLowerCase()
  for (const [key, val] of Object.entries(PITCH_NOTES)) {
    if (v.includes(key)) return val
  }
  return 'Standard T20 pitch. Balanced conditions.'
}

function parseScore(scoreStr: string) {
  // e.g. "154/3" or "154/3 (18.2)"
  const match = scoreStr.match(/(\d+)\/(\d+)/)
  if (!match) return { runs: 0, wickets: 0 }
  return { runs: parseInt(match[1]), wickets: parseInt(match[2]) }
}

function parseOvers(scoreStr: string) {
  const match = scoreStr.match(/\((\d+)\.?(\d*)\)/)
  if (!match) return { overs: 0, balls: 0 }
  return { overs: parseInt(match[1]), balls: parseInt(match[2] || '0') }
}

export async function GET(req: NextRequest) {
  try {
    if (!CRICAPI_KEY) {
      return NextResponse.json({ error: 'CRICAPI_KEY not set in environment variables' }, { status: 500 })
    }

    // Fetch current matches from CricAPI
    const res = await fetch(
      `https://api.cricapi.com/v1/currentMatches?apikey=${CRICAPI_KEY}&offset=0`,
      { next: { revalidate: 30 } } // cache 30s
    )
    const data = await res.json()

    if (!data.data || data.status !== 'success') {
      return NextResponse.json({ found: false, error: 'CricAPI error: ' + (data.reason || 'unknown') })
    }

    // Find live IPL T20 match
    const iplMatch = data.data.find((m: any) =>
      m.matchType === 't20' &&
      m.status === 'live' &&
      (m.series_id?.toLowerCase().includes('ipl') ||
        m.name?.toLowerCase().includes('ipl') ||
        (m.teamInfo?.some((t: any) =>
          ['csk','mi','rcb','kkr','dc','rr','srh','pbks','gt','lsg'].some(team =>
            t.shortname?.toLowerCase() === team
          )
        )))
    )

    if (!iplMatch) {
      // Return most recent T20 match if no IPL found
      const anyT20 = data.data.find((m: any) => m.matchType === 't20' && m.status === 'live')
      if (!anyT20) return NextResponse.json({ found: false })

      return buildResponse(anyT20)
    }

    return buildResponse(iplMatch)
  } catch (e: any) {
    return NextResponse.json({ found: false, error: e.message }, { status: 500 })
  }
}

function buildResponse(m: any) {
  // Extract teams
  const t1 = m.teamInfo?.[0] || {}
  const t2 = m.teamInfo?.[1] || {}

  // Parse scores — CricAPI returns score array
  const scores = m.score || []
  const inn1 = scores[0]
  const inn2 = scores[1]

  // Determine batting team / innings
  const innings = scores.length >= 2 && inn2 ? 2 : 1
  const currentScore = innings === 2 ? inn2 : inn1
  const prevScore = innings === 2 ? inn1 : null

  const { runs, wickets } = currentScore ? parseScore(`${currentScore.r}/${currentScore.w}`) : { runs: 0, wickets: 0 }
  const { overs, balls } = currentScore ? { overs: Math.floor(currentScore.o), balls: Math.round((currentScore.o % 1) * 10) } : { overs: 0, balls: 0 }

  const totalBalls = overs * 6 + balls
  const crr = totalBalls > 0 ? ((runs / totalBalls) * 6).toFixed(2) : '0.00'

  let target = null
  let rrr = null
  if (innings === 2 && prevScore) {
    target = prevScore.r + 1
    const ballsLeft = 120 - totalBalls
    const runsNeeded = target - runs
    rrr = ballsLeft > 0 ? ((runsNeeded / ballsLeft) * 6).toFixed(2) : null
  }

  const venue = m.venue || ''

  return NextResponse.json({
    found: true,
    matchId: m.id,
    team1: t1.shortname || m.teams?.[0] || 'TM1',
    team2: t2.shortname || m.teams?.[1] || 'TM2',
    team1Full: t1.name || m.teams?.[0] || 'Team 1',
    team2Full: t2.name || m.teams?.[1] || 'Team 2',
    venue,
    pitch: getPitch(venue),
    innings,
    battingTeam: innings === 2 ? (t2.shortname || 'TM2') : (t1.shortname || 'TM1'),
    score: `${runs}/${wickets}`,
    runs,
    wickets,
    overs,
    balls,
    crr,
    target,
    rrr,
    team1Score: prevScore?.r ?? null,
    team1Wickets: prevScore?.w ?? null,
    toss: m.tossWinner ? `${m.tossWinner} won toss, chose to ${m.tossChoice}` : '',
    matchStatus: m.status || 'Live',
    lastUpdated: new Date().toISOString(),
  })
}
