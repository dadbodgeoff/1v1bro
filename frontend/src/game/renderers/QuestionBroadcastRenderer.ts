/**
 * QuestionBroadcastRenderer - In-arena question display
 * Renders as a floor projection in the center hub area
 * Layered BEHIND players but with high contrast for readability
 */

import { BaseRenderer } from './BaseRenderer'
import { HUB_CONFIG } from '../config'

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

export class QuestionBroadcastRenderer extends BaseRenderer {
  private state: BroadcastState = {
    question: null,
    selectedAnswer: null,
    answerSubmitted: false,
    visible: false,
  }

  private fadeAlpha = 0
  private targetAlpha = 0

  // Center on hub
  private readonly CENTER_X = HUB_CONFIG.center.x
  private readonly CENTER_Y = HUB_CONFIG.center.y

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

    // Draw floor projection effect
    this.drawFloorGlow()

    // Draw timer arc around hub
    this.drawTimerArc(question)

    // Draw question number
    this.drawQuestionNumber(question.qNum)

    // Draw question text
    this.drawQuestionText(question.text)

    // Draw options in 2x2 grid
    this.drawOptions(question.options, selectedAnswer, answerSubmitted)

    // Draw waiting indicator
    if (answerSubmitted) {
      this.drawWaitingDots()
    }

    ctx.restore()
  }

  private drawFloorGlow(): void {
    if (!this.ctx) return
    const ctx = this.ctx

    // Subtle floor glow emanating from center
    const gradient = ctx.createRadialGradient(
      this.CENTER_X, this.CENTER_Y, 0,
      this.CENTER_X, this.CENTER_Y, 280
    )
    gradient.addColorStop(0, `rgba(100, 60, 140, ${0.15 * this.fadeAlpha})`)
    gradient.addColorStop(0.5, `rgba(60, 30, 100, ${0.08 * this.fadeAlpha})`)
    gradient.addColorStop(1, 'rgba(30, 15, 50, 0)')

    ctx.fillStyle = gradient
    ctx.fillRect(this.CENTER_X - 300, this.CENTER_Y - 200, 600, 400)
  }

  private drawTimerArc(question: BroadcastQuestion): void {
    if (!this.ctx) return
    const ctx = this.ctx

    const elapsed = Date.now() - question.startTime
    const remaining = Math.max(0, question.totalTime - elapsed)
    const progress = remaining / question.totalTime
    const seconds = Math.ceil(remaining / 1000)

    const radius = HUB_CONFIG.outerRadius + 15

    // Background arc
    ctx.beginPath()
    ctx.arc(this.CENTER_X, this.CENTER_Y, radius, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(80, 60, 100, ${0.3 * this.fadeAlpha})`
    ctx.lineWidth = 4
    ctx.stroke()

    // Progress arc
    if (progress > 0) {
      const startAngle = -Math.PI / 2
      const endAngle = startAngle + Math.PI * 2 * progress

      ctx.beginPath()
      ctx.arc(this.CENTER_X, this.CENTER_Y, radius, startAngle, endAngle)

      // Color based on time
      let color: string
      if (seconds <= 5) {
        color = `rgba(255, 100, 100, ${0.8 * this.fadeAlpha})`
      } else if (seconds <= 10) {
        color = `rgba(255, 200, 100, ${0.7 * this.fadeAlpha})`
      } else {
        color = `rgba(180, 140, 220, ${0.6 * this.fadeAlpha})`
      }

      ctx.strokeStyle = color
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      ctx.stroke()
    }

    // Timer text at top of arc
    ctx.font = 'bold 16px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = seconds <= 5 
      ? `rgba(255, 120, 120, ${this.fadeAlpha})` 
      : `rgba(220, 200, 240, ${0.9 * this.fadeAlpha})`
    ctx.fillText(`${seconds}s`, this.CENTER_X, this.CENTER_Y - radius - 16)
  }

  private drawQuestionNumber(qNum: number): void {
    if (!this.ctx) return
    const ctx = this.ctx

    ctx.font = 'bold 11px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = `rgba(160, 140, 180, ${0.7 * this.fadeAlpha})`
    ctx.fillText(`Q${qNum}`, this.CENTER_X, this.CENTER_Y - 85)
  }

  private drawQuestionText(text: string): void {
    if (!this.ctx) return
    const ctx = this.ctx

    // High contrast text with subtle shadow for readability
    ctx.font = '15px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Text shadow for contrast
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
    ctx.shadowBlur = 4
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 1

    ctx.fillStyle = `rgba(255, 255, 255, ${0.95 * this.fadeAlpha})`

    // Word wrap
    const maxWidth = 340
    const lines = this.wrapText(text, maxWidth)
    const lineHeight = 20
    const startY = this.CENTER_Y - 55

    lines.forEach((line, i) => {
      ctx.fillText(line, this.CENTER_X, startY + i * lineHeight)
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
    const optionW = 155
    const optionH = 36
    const gapX = 12
    const gapY = 8
    const startX = this.CENTER_X - optionW - gapX / 2
    const startY = this.CENTER_Y + 10

    options.forEach((option, i) => {
      const col = i % 2
      const row = Math.floor(i / 2)
      const x = startX + col * (optionW + gapX)
      const y = startY + row * (optionH + gapY)

      const letter = letters[i]
      const isSelected = selectedAnswer === letter
      const keyNum = i + 1

      // Option background
      ctx.beginPath()
      this.roundRect(x, y, optionW, optionH, 8)

      if (isSelected) {
        ctx.fillStyle = `rgba(140, 100, 180, ${0.5 * this.fadeAlpha})`
        ctx.fill()
        ctx.strokeStyle = `rgba(200, 160, 240, ${0.7 * this.fadeAlpha})`
        ctx.lineWidth = 2
        ctx.stroke()
      } else {
        ctx.fillStyle = `rgba(30, 25, 45, ${(answerSubmitted ? 0.3 : 0.6) * this.fadeAlpha})`
        ctx.fill()
        ctx.strokeStyle = `rgba(100, 80, 130, ${0.4 * this.fadeAlpha})`
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Key badge
      const badgeSize = 22
      const badgeX = x + 10
      const badgeY = y + (optionH - badgeSize) / 2

      ctx.beginPath()
      this.roundRect(badgeX, badgeY, badgeSize, badgeSize, 5)
      ctx.fillStyle = isSelected 
        ? `rgba(255, 255, 255, ${0.95 * this.fadeAlpha})`
        : `rgba(80, 70, 100, ${0.7 * this.fadeAlpha})`
      ctx.fill()

      ctx.font = 'bold 12px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = isSelected 
        ? `rgba(40, 30, 60, ${this.fadeAlpha})`
        : `rgba(200, 190, 220, ${0.9 * this.fadeAlpha})`
      ctx.fillText(String(keyNum), badgeX + badgeSize / 2, badgeY + badgeSize / 2)

      // Option text
      ctx.font = '13px system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'

      const textAlpha = answerSubmitted && !isSelected ? 0.4 : 0.95
      ctx.fillStyle = `rgba(240, 235, 250, ${textAlpha * this.fadeAlpha})`

      const textX = badgeX + badgeSize + 10
      const maxTextW = optionW - badgeSize - 30
      const truncated = this.truncateText(option, maxTextW)
      ctx.fillText(truncated, textX, y + optionH / 2)
    })
  }

  private drawWaitingDots(): void {
    if (!this.ctx) return
    const ctx = this.ctx

    const y = this.CENTER_Y + 115
    const dotCount = 3
    const dotSpacing = 10
    const baseX = this.CENTER_X - ((dotCount - 1) * dotSpacing) / 2

    for (let i = 0; i < dotCount; i++) {
      const phase = (Date.now() / 400 + i * 0.33) % 1
      const alpha = 0.3 + Math.sin(phase * Math.PI) * 0.5

      ctx.beginPath()
      ctx.arc(baseX + i * dotSpacing, y, 3, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(180, 160, 200, ${alpha * this.fadeAlpha})`
      ctx.fill()
    }

    ctx.font = '11px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = `rgba(140, 130, 160, ${0.7 * this.fadeAlpha})`
    ctx.fillText('waiting', this.CENTER_X, y + 18)
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
    return lines.slice(0, 2) // Max 2 lines
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
