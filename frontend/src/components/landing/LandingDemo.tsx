/**
 * LandingDemo - Interactive demo showing gameplay
 * Simulates a trivia question + arena combat preview
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface DemoQuestion {
  text: string
  options: string[]
  correct: number
}

const DEMO_QUESTIONS: DemoQuestion[] = [
  {
    text: 'What year did Fortnite Battle Royale launch?',
    options: ['2016', '2017', '2018', '2019'],
    correct: 1,
  },
  {
    text: 'Which location was added in Chapter 2?',
    options: ['Tilted Towers', 'Lazy Lake', 'Pleasant Park', 'Retail Row'],
    correct: 1,
  },
  {
    text: 'What is the rarest pickaxe in Fortnite?',
    options: ['Reaper', 'Raiders Revenge', 'AC/DC', 'Candy Axe'],
    correct: 1,
  },
]

export function LandingDemo() {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [playerScore, setPlayerScore] = useState(0)
  const [botScore, setBotScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(15)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const question = DEMO_QUESTIONS[questionIndex]

  // Timer countdown
  useEffect(() => {
    if (showResult) return

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleTimeout()
          return 15
        }
        return t - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [questionIndex, showResult])

  const handleTimeout = () => {
    if (selectedAnswer === null) {
      // Bot "answers" correctly sometimes
      const botCorrect = Math.random() > 0.4
      if (botCorrect) setBotScore((s) => s + 100)
      setShowResult(true)
      setTimeout(nextQuestion, 2000)
    }
  }

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null || showResult) return

    setSelectedAnswer(index)
    setShowResult(true)

    const isCorrect = index === question.correct
    if (isCorrect) {
      setPlayerScore((s) => s + 100)
    }

    // Bot also "answers"
    const botCorrect = Math.random() > 0.5
    if (botCorrect) setBotScore((s) => s + 100)

    setTimeout(nextQuestion, 2500)
  }

  const nextQuestion = () => {
    setSelectedAnswer(null)
    setShowResult(false)
    setTimeLeft(15)
    setQuestionIndex((i) => (i + 1) % DEMO_QUESTIONS.length)
  }

  return (
    <div className="w-full h-full bg-neutral-900 flex flex-col">
      {/* Score bar */}
      <div className="flex justify-between items-center px-4 py-3 bg-neutral-950 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-medium">
            You
          </div>
          <span className="font-mono text-lg font-semibold">{playerScore}</span>
        </div>
        <div className="text-neutral-500 text-sm">Q{questionIndex + 1}/3</div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-lg font-semibold">{botScore}</span>
          <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-medium">
            Bot
          </div>
        </div>
      </div>

      {/* Arena preview (simplified) */}
      <div className="flex-1 relative overflow-hidden">
        <ArenaPreview playerScore={playerScore} botScore={botScore} />
      </div>

      {/* Question panel */}
      <div className="p-4 bg-neutral-950 border-t border-white/5">
        {/* Timer */}
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-neutral-500">Time remaining</span>
          <span className={`font-mono text-sm ${timeLeft <= 5 ? 'text-red-400' : 'text-neutral-400'}`}>
            {timeLeft}s
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-neutral-800 rounded-full mb-4 overflow-hidden">
          <motion.div
            className="h-full bg-white"
            initial={{ width: '100%' }}
            animate={{ width: `${(timeLeft / 15) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={questionIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <p className="text-sm font-medium mb-4">{question.text}</p>

            {/* Options */}
            <div className="grid grid-cols-2 gap-2">
              {question.options.map((option, i) => {
                const isSelected = selectedAnswer === i
                const isCorrect = i === question.correct
                const showCorrect = showResult && isCorrect
                const showWrong = showResult && isSelected && !isCorrect

                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    disabled={showResult}
                    className={`
                      px-3 py-2 text-sm text-left rounded-lg border transition-all
                      ${showCorrect ? 'bg-green-500/20 border-green-500/50 text-green-400' : ''}
                      ${showWrong ? 'bg-red-500/20 border-red-500/50 text-red-400' : ''}
                      ${!showResult && !isSelected ? 'bg-neutral-800 border-white/10 hover:border-white/30' : ''}
                      ${isSelected && !showResult ? 'border-white/50' : ''}
                      disabled:cursor-default
                    `}
                  >
                    <span className="text-neutral-500 mr-2">{String.fromCharCode(65 + i)}.</span>
                    {option}
                  </button>
                )
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// Simplified arena preview
function ArenaPreview(_props: { playerScore: number; botScore: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const playerPos = useRef({ x: 100, y: 100 })
  const botPos = useRef({ x: 250, y: 100 })
  const projectiles = useRef<Array<{ x: number; y: number; vx: number; vy: number; isPlayer: boolean }>>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.offsetWidth * 2
      canvas.height = canvas.offsetHeight * 2
      ctx.scale(2, 2)
    }
    resize()

    let time = 0
    const animate = () => {
      time += 0.016
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const w = canvas.offsetWidth
      const h = canvas.offsetHeight

      // Draw grid
      ctx.strokeStyle = 'rgba(255,255,255,0.03)'
      ctx.lineWidth = 1
      for (let x = 0; x < w; x += 30) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.stroke()
      }
      for (let y = 0; y < h; y += 30) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }

      // Animate player
      playerPos.current.x = 80 + Math.sin(time * 2) * 20
      playerPos.current.y = h / 2 + Math.cos(time * 1.5) * 30

      // Animate bot
      botPos.current.x = w - 80 + Math.sin(time * 1.8) * 15
      botPos.current.y = h / 2 + Math.sin(time * 2.2) * 25

      // Spawn projectiles occasionally
      if (Math.random() < 0.02) {
        const isPlayer = Math.random() > 0.5
        const from = isPlayer ? playerPos.current : botPos.current
        const to = isPlayer ? botPos.current : playerPos.current
        const angle = Math.atan2(to.y - from.y, to.x - from.x)
        projectiles.current.push({
          x: from.x,
          y: from.y,
          vx: Math.cos(angle) * 4,
          vy: Math.sin(angle) * 4,
          isPlayer,
        })
      }

      // Update and draw projectiles
      projectiles.current = projectiles.current.filter((p) => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > w || p.y < 0 || p.y > h) return false

        ctx.fillStyle = p.isPlayer ? 'rgba(255,255,255,0.8)' : 'rgba(255,100,100,0.8)'
        ctx.beginPath()
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
        ctx.fill()
        return true
      })

      // Draw player
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(playerPos.current.x, playerPos.current.y, 12, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#333'
      ctx.font = '8px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('You', playerPos.current.x, playerPos.current.y + 3)

      // Draw bot
      ctx.fillStyle = '#666'
      ctx.beginPath()
      ctx.arc(botPos.current.x, botPos.current.y, 12, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.fillText('Bot', botPos.current.x, botPos.current.y + 3)

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ imageRendering: 'pixelated' }}
    />
  )
}

export default LandingDemo
