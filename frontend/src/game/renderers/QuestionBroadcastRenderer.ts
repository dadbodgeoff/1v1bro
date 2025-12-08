/**
 * QuestionBroadcastRenderer - Bottom panel question display
 * Positioned at bottom of arena, slightly overlapping into play area
 * Wide horizontal layout - question left, options right
 */

import { BaseRenderer } from './BaseRenderer'

export interface BroadcastQuestion {
  qNum: number
  text: string
  options: string[]
  startTime: number
  totalTime: number // ms
}

export interface BroadcastState {
  question: BroadcastQuestion | null
  selectedAnswer: string | null
  answerSubmitted: boolean
  visible: boolean
}

// Arena dimensions
const ARENA_WIDTH = 1280
const ARENA_HEIGHT = 720

export class QuestionBroadcastRenderer extends BaseRenderer {
  private state: BroadcastState = {
    question: null,
    selectedAnswer: null,
    answerSubmitted: false,
    visible: false,
  }

  private fadeAlpha = 0
  private targetAlpha = 0

  // Panel dimensions - wide and short
  private readonly PANEL_WIDTH = 900
  private readonly PANEL_HEIGHT = 120
  
  // Position: centered horizontally, overlapping bottom edge by ~30px
  private readonly PANEL_X = (ARENA_WIDTH - 900) / 2 // centered
  private readonly PANEL_Y = ARENA_HEIGHT - 150 // overlaps into arena

  setState(state: BroadcastState): void {
    this.state = state
    this.targetAlpha = state.visible && state.question ? 1 : 0
  }

  update(deltaTime: number): void {
    const fadeSpeed = 5
    if (this.fadeAlpha < this.targetAlpha) {
      this.fadeAlpha = Math.min(this.targetAlpha, this.fadeAlpha + fadeSpeed * deltaTime)
    } else if (this.fadeAlpha > this.targetAlpha) {
      this.fadeAlpha = Math.max(this.targetAlpha, this.fadeAlpha - fadeSpeed * deltaTime)
    }
  }

  render(): void {
    if (!this.ctx || this.fadeAlpha <= 0 || !this.state.question) return

    const ctx = this.ctx
    const { question, selectedAnswer, answerSubmitted } = this.state

    ctx.save()

    // Draw panel backdrop
    this.drawPanelBackdrop()

    // Draw timer bar at top of panel
    this.drawTimerBar(question)

    // Draw question text (left side)
    this.drawQuestionText(question.qNum, question.text)

    // Draw options (right side, 2x2 grid)
    this.drawOptions(question.options, selectedAnswer, answerSubmitted)

    // Draw waiting indicator if submitted
    if (answerSubmitted) {
      this.drawWaitingIndicator()
    }

    ctx.restore()
  }

  private drawPanelBackdrop(): void {
    if (!this.ctx) return
    const ctx = this.ctx

    // Main panel background
    ctx.beginPath()
    this.roundRect(this.PANEL_X, this.PANEL_Y, this.PANEL_WIDTH, this.PANEL_HEIGHT, 12)
    
    // Dark gradient background
    const gradient = ctx.createLinearGradient(
      this.PANEL_X, this.PANEL_Y,
      this.PANEL_X, this.PANEL_Y + this.PANEL_HEIGHT
    )
    gradient.addColorStop(0, `rgba(12, 8, 20, ${0.94 * this.fadeAlpha})`)
    gradient.addColorStop(1, `rgba(20, 14, 35, ${0.92 * this.fadeAlpha})`)
    ctx.fillStyle = gradient
    ctx.fill()

    // Border
    ctx.strokeStyle = `rgba(100, 70, 150, ${0.6 * this.fadeAlpha})`
    ctx.lineWidth = 2
    ctx.stroke()

    // Top edge glow (connects to arena)
    const topGlow = ctx.createLinearGradient(
      this.PANEL_X, this.PANEL_Y - 10,
      this.PANEL_X, this.PANEL_Y + 20
    )
    topGlow.addColorStop(0, 'rgba(120, 80, 180, 0)')
    topGlow.addColorStop(0.5, `rgba(120, 80, 180, ${0.3 * this.fadeAlpha})`)
    topGlow.addColorStop(1, 'rgba(120, 80, 180, 0)')
    
    ctx.fillStyle = topGlow
    ctx.fillRect(this.PANEL_X + 20, this.PANEL_Y - 5, this.PANEL_WIDTH - 40, 15)
  }

  private drawTimerBar(question: BroadcastQuestion): void {
    if (!this.ctx) return
    const ctx = this.ctx

    const elapsed = Date.now() - question.startTime
    const remaining = Math.max(0, question.totalTime - elapsed)
    const progress = remaining / question.totalTime
    const seconds = Math.ceil(remaining / 1000)

    const barX = this.PANEL_X + 16
    const barY = this.PANEL_Y + 12
    const barWidth = this.PANEL_WIDTH - 32
    const barHeight = 6

    // Background bar
    ctx.beginPath()
    this.roundRect(barX, barY, barWidth, barHeight, 3)
    ctx.fillStyle = `rgba(50, 40, 70, ${0.7 * this.fadeAlpha})`
    ctx.fill()

    // Progress bar
    if (progress > 0) {
      ctx.beginPath()
      this.roundRect(barX, barY, barWidth * progress, barHeight, 3)
      
      let color: string
      if (seconds <= 5) {
        const pulse = 0.7 + Math.sin(Date.now() / 150) * 0.3
        color = `rgba(255, 80, 80, ${pulse * this.fadeAlpha})`
      } else if (seconds <= 10) {
        color = `rgba(255, 180, 80, ${0.9 * this.fadeAlpha})`
      } else {
        color = `rgba(130, 90, 190, ${0.85 * this.fadeAlpha})`
      }
      
      ctx.fillStyle = color
      ctx.fill()
    }

    // Timer text (right end)
    ctx.font = 'bold 12px monospace'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = seconds <= 5 
      ? `rgba(255, 100, 100, ${this.fadeAlpha})` 
      : `rgba(180, 160, 210, ${0.9 * this.fadeAlpha})`
    ctx.fillText(`${seconds}s`, barX + barWidth, barY + barHeight + 12)
  }

  private drawQuestionText(qNum: number, text: string): void {
    if (!this.ctx) return
    const ctx = this.ctx

    const textX = this.PANEL_X + 24
    const textY = this.PANEL_Y + 45
    const maxWidth = 380

    // Question number badge
    ctx.font = 'bold 11px system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillStyle = `rgba(130, 110, 170, ${0.8 * this.fadeAlpha})`
    ctx.fillText(`Q${qNum}`, textX, textY - 8)

    // Question text
    ctx.font = 'bold 16px system-ui, sans-serif'
    ctx.textBaseline = 'top'
    
    // Shadow for readability
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
    ctx.shadowBlur = 4
    ctx.shadowOffsetY = 1

    ctx.fillStyle = `rgba(255, 255, 255, ${0.96 * this.fadeAlpha})`

    // Word wrap
    const lines = this.wrapText(text, maxWidth)
    const lineHeight = 20
    
    lines.forEach((line, i) => {
      ctx.fillText(line, textX, textY + 8 + i * lineHeight)
    })

    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
  }

  private drawOptions(
    options: string[],
    selectedAnswer: string | null,
    answerSubmitted: boolean
  ): void {
    if (!this.ctx) return
    const ctx = this.ctx

    const letters = ['A', 'B', 'C', 'D']
    
    // Options on right side, 2x2 grid
    const optionW = 200
    const optionH = 38
    const gapX = 10
    const gapY = 8
    const gridStartX = this.PANEL_X + 440
    const gridStartY = this.PANEL_Y + 32

    options.forEach((option, i) => {
      const col = i % 2
      const row = Math.floor(i / 2)
      const x = gridStartX + col * (optionW + gapX)
      const y = gridStartY + row * (optionH + gapY)

      const letter = letters[i]
      const isSelected = selectedAnswer === letter
      const keyNum = i + 1

      // Option background
      ctx.beginPath()
      this.roundRect(x, y, optionW, optionH, 8)

      if (isSelected) {
        ctx.fillStyle = `rgba(110, 70, 170, ${0.75 * this.fadeAlpha})`
        ctx.fill()
        ctx.strokeStyle = `rgba(180, 140, 240, ${0.9 * this.fadeAlpha})`
        ctx.lineWidth = 2
        ctx.stroke()
      } else {
        ctx.fillStyle = `rgba(35, 28, 55, ${(answerSubmitted ? 0.4 : 0.8) * this.fadeAlpha})`
        ctx.fill()
        ctx.strokeStyle = `rgba(80, 65, 110, ${0.5 * this.fadeAlpha})`
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Key number badge
      const badgeSize = 24
      const badgeX = x + 10
      const badgeY = y + (optionH - badgeSize) / 2

      ctx.beginPath()
      this.roundRect(badgeX, badgeY, badgeSize, badgeSize, 5)
      ctx.fillStyle = isSelected 
        ? `rgba(255, 255, 255, ${0.98 * this.fadeAlpha})`
        : `rgba(60, 50, 90, ${0.8 * this.fadeAlpha})`
      ctx.fill()

      ctx.font = 'bold 13px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = isSelected 
        ? `rgba(35, 25, 60, ${this.fadeAlpha})`
        : `rgba(190, 175, 220, ${0.95 * this.fadeAlpha})`
      ctx.fillText(String(keyNum), badgeX + badgeSize / 2, badgeY + badgeSize / 2)

      // Option text
      ctx.font = '14px system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'

      const textAlpha = answerSubmitted && !isSelected ? 0.35 : 0.95
      ctx.fillStyle = `rgba(240, 235, 255, ${textAlpha * this.fadeAlpha})`

      const textX = badgeX + badgeSize + 10
      const maxTextW = optionW - badgeSize - 28
      const truncated = this.truncateText(option, maxTextW)
      ctx.fillText(truncated, textX, y + optionH / 2)
    })
  }

  private drawWaitingIndicator(): void {
    if (!this.ctx) return
    const ctx = this.ctx

    // Position below options
    const x = this.PANEL_X + this.PANEL_WIDTH - 100
    const y = this.PANEL_Y + this.PANEL_HEIGHT - 18

    const dotCount = 3
    const dotSpacing = 8
    const baseX = x - ((dotCount - 1) * dotSpacing) / 2

    for (let i = 0; i < dotCount; i++) {
      const phase = (Date.now() / 350 + i * 0.33) % 1
      const alpha = 0.3 + Math.sin(phase * Math.PI) * 0.5

      ctx.beginPath()
      ctx.arc(baseX + i * dotSpacing, y, 3, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(160, 140, 200, ${alpha * this.fadeAlpha})`
      ctx.fill()
    }

    ctx.font = '10px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = `rgba(130, 120, 160, ${0.7 * this.fadeAlpha})`
    ctx.fillText('waiting', x, y + 12)
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
    if (!this.ctx) return
    const ctx = this.ctx
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }

  private wrapText(text: string, maxWidth: number): string[] {
    if (!this.ctx) return [text]
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      if (this.ctx.measureText(testLine).width > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }
    if (currentLine) lines.push(currentLine)
    return lines.slice(0, 3) // Max 3 lines for bottom panel
  }

  private truncateText(text: string, maxWidth: number): string {
    if (!this.ctx) return text
    if (this.ctx.measureText(text).width <= maxWidth) return text

    let truncated = text
    while (truncated.length > 0 && this.ctx.measureText(truncated + '…').width > maxWidth) {
      truncated = truncated.slice(0, -1)
    }
    return truncated + '…'
  }
}
