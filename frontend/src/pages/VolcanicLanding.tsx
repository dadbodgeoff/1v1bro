import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Volcanic Boot Sequence Landing Page
 * A dramatic console-style boot animation with volcanic/lava theme
 */
export function VolcanicLanding() {
  const [bootComplete, setBootComplete] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const navigate = useNavigate()

  const skipBoot = useCallback(() => {
    setBootComplete(true)
    setTimeout(() => setShowContent(true), 100)
  }, [])

  useEffect(() => {
    // Auto-complete boot sequence after 5.5 seconds
    const bootTimer = setTimeout(() => {
      setBootComplete(true)
      setTimeout(() => setShowContent(true), 500)
    }, 5500)

    // Keyboard skip
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.code === 'Space' || e.code === 'Enter') && !bootComplete) {
        skipBoot()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      clearTimeout(bootTimer)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [bootComplete, skipBoot])

  return (
    <div className="volcanic-landing">
      <style>{styles}</style>
      
      {/* Boot Sequence */}
      <div className={`boot-sequence ${bootComplete ? 'fade-out' : ''}`}>
        <div className="cracks-container">
          <div className="crack crack-1" />
          <div className="crack crack-2" />
          <div className="crack crack-3" />
          <div className="crack crack-4" />
          <div className="crack crack-5" />
        </div>
        
        <EmberParticles count={30} />
        
        <div className="boot-text">
          <div className="boot-line">INITIALIZING ARENA SYSTEMS...</div>
          <div className="boot-line">LOADING VOLCANIC CORE... OK</div>
          <div className="boot-line">CALIBRATING COMBAT MODULES...</div>
          <div className="boot-line">SYNCING PLAYER DATA...</div>
          <div className="boot-line">ARENA READY</div>
          
          <div className="boot-logo">1v1 BRO</div>
          
          <div className="boot-progress">
            <div className="boot-progress-bar" />
          </div>
        </div>
      </div>

      {!bootComplete && (
        <button className="skip-btn" onClick={skipBoot}>
          Skip Intro
        </button>
      )}

      {/* Main Content */}
      <main className={`main-content ${showContent ? 'visible' : ''}`}>
        <div className="ambient-embers">
          <EmberParticles count={15} />
        </div>
        
        <section className="hero">
          <div className="heat-distortion" />
          
          <div className="hero-content">
            <h1 className="hero-logo">1v1 BRO</h1>
            <p className="hero-tagline">Competitive Arena Combat Meets Trivia</p>
            
            <div className="cta-group">
              <button className="btn btn-primary" onClick={() => navigate('/register')}>
                <PlayIcon />
                Play Now
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/login')}>
                Sign In
              </button>
            </div>
            
            <div className="demo-preview">
              <div className="demo-placeholder">
                <div className="play-icon">
                  <PlayIcon />
                </div>
                <span>Watch Gameplay Demo</span>
              </div>
            </div>
          </div>
        </section>

        <section className="features">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">⚔️</div>
              <h3 className="feature-title">Fast-Paced Combat</h3>
              <p className="feature-desc">Intense 1v1 arena battles with skill-based mechanics. Every match is a test of reflexes and strategy.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🧠</div>
              <h3 className="feature-title">Trivia Twist</h3>
              <p className="feature-desc">Answer questions to gain power-ups and advantages. Knowledge is literally power in the arena.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3 className="feature-title">Ranked Matches</h3>
              <p className="feature-desc">Climb the leaderboards and prove you're the ultimate 1v1 champion. Seasons, rewards, and glory await.</p>
            </div>
          </div>
        </section>
      </main>

      {showContent && (
        <button className="replay-btn" onClick={() => window.location.reload()}>
          🔥 Replay Intro
        </button>
      )}
    </div>
  )
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z"/>
    </svg>
  )
}

function EmberParticles({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="ember"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 4}s`,
            animationDuration: `${3 + Math.random() * 2}s`,
          }}
        />
      ))}
    </>
  )
}

const styles = `
  .volcanic-landing {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: #09090B;
    color: #FFFFFF;
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* ============================================
   * BOOT SEQUENCE CONTAINER
   * ============================================ */
  .boot-sequence {
    position: fixed;
    inset: 0;
    background: #000;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }

  .boot-sequence.fade-out {
    animation: bootFadeOut 1s ease-out forwards;
    animation-delay: 0.5s;
  }

  @keyframes bootFadeOut {
    to {
      opacity: 0;
      pointer-events: none;
    }
  }

  /* ============================================
   * VOLCANIC CRACKS OVERLAY
   * ============================================ */
  .cracks-container {
    position: absolute;
    inset: 0;
    overflow: hidden;
    opacity: 0;
    animation: cracksAppear 1s ease-out forwards;
    animation-delay: 0.5s;
  }

  @keyframes cracksAppear {
    to { opacity: 1; }
  }

  .crack {
    position: absolute;
    background: linear-gradient(90deg, transparent, #FF6B35, #FCD34D, #FF6B35, transparent);
    filter: blur(2px);
    box-shadow: 0 0 20px #FF6B35, 0 0 40px #DC2626;
    transform-origin: center;
  }

  .crack-1 {
    width: 60%;
    height: 3px;
    top: 30%;
    left: 20%;
    animation: crackGlow 2s ease-in-out infinite alternate;
  }

  .crack-2 {
    width: 40%;
    height: 2px;
    top: 50%;
    left: 35%;
    transform: rotate(-15deg);
    animation: crackGlow 2.5s ease-in-out infinite alternate;
    animation-delay: 0.3s;
  }

  .crack-3 {
    width: 50%;
    height: 2px;
    top: 70%;
    left: 25%;
    transform: rotate(10deg);
    animation: crackGlow 1.8s ease-in-out infinite alternate;
    animation-delay: 0.6s;
  }

  .crack-4 {
    width: 3px;
    height: 40%;
    top: 25%;
    left: 40%;
    animation: crackGlow 2.2s ease-in-out infinite alternate;
    animation-delay: 0.2s;
  }

  .crack-5 {
    width: 2px;
    height: 35%;
    top: 35%;
    left: 60%;
    transform: rotate(20deg);
    animation: crackGlow 2s ease-in-out infinite alternate;
    animation-delay: 0.5s;
  }

  @keyframes crackGlow {
    0% { opacity: 0.6; filter: blur(2px); }
    100% { opacity: 1; filter: blur(1px); }
  }

  /* ============================================
   * BOOT TEXT
   * ============================================ */
  .boot-text {
    position: relative;
    z-index: 10;
    text-align: center;
  }

  .boot-line {
    opacity: 0;
    font-size: 14px;
    color: #FF6B35;
    text-shadow: 0 0 10px rgba(249, 115, 22, 0.6);
    margin: 8px 0;
    letter-spacing: 0.05em;
  }

  .boot-line:nth-child(1) { animation: bootLineIn 0.3s ease-out forwards; animation-delay: 1s; }
  .boot-line:nth-child(2) { animation: bootLineIn 0.3s ease-out forwards; animation-delay: 1.4s; }
  .boot-line:nth-child(3) { animation: bootLineIn 0.3s ease-out forwards; animation-delay: 1.8s; }
  .boot-line:nth-child(4) { animation: bootLineIn 0.3s ease-out forwards; animation-delay: 2.2s; }
  .boot-line:nth-child(5) { animation: bootLineIn 0.3s ease-out forwards; animation-delay: 2.6s; }

  @keyframes bootLineIn {
    0% { opacity: 0; transform: translateY(10px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  .boot-logo {
    font-size: 48px;
    font-weight: 800;
    color: #FFFFFF;
    text-shadow: 0 0 30px #F97316, 0 0 60px #DC2626;
    opacity: 0;
    animation: logoReveal 1s ease-out forwards;
    animation-delay: 3s;
    margin-top: 32px;
  }

  @keyframes logoReveal {
    0% { opacity: 0; transform: scale(0.8); filter: blur(10px); }
    50% { filter: blur(0); }
    100% { opacity: 1; transform: scale(1); filter: blur(0); }
  }

  /* ============================================
   * PROGRESS BAR
   * ============================================ */
  .boot-progress {
    width: 300px;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    margin-top: 24px;
    overflow: hidden;
    opacity: 0;
    animation: fadeIn 0.3s ease-out forwards;
    animation-delay: 3.2s;
  }

  .boot-progress-bar {
    height: 100%;
    width: 0;
    background: linear-gradient(90deg, #DC2626, #F97316, #FCD34D);
    border-radius: 2px;
    box-shadow: 0 0 10px #F97316;
    animation: progressFill 1.5s ease-out forwards;
    animation-delay: 3.4s;
  }

  @keyframes progressFill { to { width: 100%; } }
  @keyframes fadeIn { to { opacity: 1; } }

  /* ============================================
   * EMBER PARTICLES
   * ============================================ */
  .ember {
    position: absolute;
    width: 4px;
    height: 4px;
    background: #FF6B35;
    border-radius: 50%;
    box-shadow: 0 0 6px #FF6B35, 0 0 12px #DC2626;
    animation: emberFloat 4s ease-out infinite;
  }

  @keyframes emberFloat {
    0% { transform: translateY(100vh) scale(1); opacity: 1; }
    100% { transform: translateY(-20vh) scale(0); opacity: 0; }
  }

  /* ============================================
   * MAIN CONTENT
   * ============================================ */
  .main-content {
    opacity: 0;
    min-height: 100vh;
    padding: 0;
    pointer-events: none;
  }

  .main-content.visible {
    animation: contentReveal 1s ease-out forwards;
    pointer-events: auto;
  }

  @keyframes contentReveal { to { opacity: 1; } }

  /* Hero Section */
  .hero {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    padding: 40px 20px;
  }

  .hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background: 
      radial-gradient(ellipse at 50% 120%, rgba(220, 38, 38, 0.3) 0%, transparent 50%),
      radial-gradient(ellipse at 30% 100%, rgba(249, 115, 22, 0.2) 0%, transparent 40%),
      radial-gradient(ellipse at 70% 100%, rgba(249, 115, 22, 0.2) 0%, transparent 40%);
    animation: volcanicPulse 4s ease-in-out infinite;
  }

  @keyframes volcanicPulse {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 1; }
  }

  .hero-content {
    position: relative;
    z-index: 10;
    text-align: center;
    max-width: 800px;
  }

  .hero-logo {
    font-size: 72px;
    font-weight: 800;
    color: #FFFFFF;
    text-shadow: 0 0 40px #F97316;
    margin-bottom: 16px;
    letter-spacing: -0.03em;
  }

  .hero-tagline {
    font-size: 24px;
    color: #B4B4B4;
    margin-bottom: 48px;
    font-weight: 500;
  }

  /* CTA Buttons */
  .cta-group {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 64px;
  }

  .btn {
    padding: 16px 32px;
    font-size: 18px;
    font-weight: 600;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease-out;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .btn-primary {
    background: #F97316;
    color: white;
    border: none;
    box-shadow: 0 0 30px rgba(249, 115, 22, 0.4);
  }

  .btn-primary:hover {
    background: #FB923C;
    transform: translateY(-2px);
    box-shadow: 0 0 40px rgba(249, 115, 22, 0.6);
  }

  .btn-secondary {
    background: transparent;
    color: white;
    border: 2px solid rgba(255, 255, 255, 0.2);
  }

  .btn-secondary:hover {
    border-color: rgba(255, 255, 255, 0.4);
    background: rgba(255, 255, 255, 0.05);
    transform: translateY(-2px);
  }

  /* Demo Preview */
  .demo-preview {
    width: 100%;
    max-width: 900px;
    aspect-ratio: 16/9;
    background: #111111;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  .demo-preview::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, transparent 50%);
  }

  .demo-placeholder {
    color: #737373;
    font-size: 18px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .play-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: #F97316;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 30px rgba(249, 115, 22, 0.5);
    cursor: pointer;
    transition: all 0.2s ease-out;
  }

  .play-icon:hover {
    transform: scale(1.1);
    box-shadow: 0 0 50px rgba(249, 115, 22, 0.7);
  }

  .play-icon svg {
    width: 32px;
    height: 32px;
    fill: white;
    margin-left: 4px;
  }

  /* Features Section */
  .features {
    padding: 80px 20px;
    background: #111111;
  }

  .features-grid {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 32px;
  }

  .feature-card {
    background: #1A1A1A;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    padding: 32px;
    transition: all 0.2s ease-out;
  }

  .feature-card:hover {
    transform: translateY(-4px);
    border-color: rgba(249, 115, 22, 0.3);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  }

  .feature-icon {
    width: 48px;
    height: 48px;
    background: rgba(249, 115, 22, 0.1);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    font-size: 24px;
  }

  .feature-title {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 12px;
  }

  .feature-desc {
    color: #B4B4B4;
    line-height: 1.6;
  }

  /* Ambient Embers */
  .ambient-embers {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 1;
    overflow: hidden;
  }

  /* Skip/Replay Buttons */
  .skip-btn, .replay-btn {
    position: fixed;
    bottom: 32px;
    right: 32px;
    padding: 12px 24px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: #B4B4B4;
    font-size: 14px;
    cursor: pointer;
    z-index: 1001;
    transition: all 0.2s ease-out;
  }

  .skip-btn {
    opacity: 0;
    animation: fadeIn 0.3s ease-out forwards;
    animation-delay: 1s;
  }

  .skip-btn:hover, .replay-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    color: white;
  }

  .replay-btn { z-index: 100; }

  /* Heat Distortion */
  .heat-distortion {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 200px;
    background: linear-gradient(to top, rgba(249, 115, 22, 0.05), transparent);
    animation: heatWave 3s ease-in-out infinite;
    pointer-events: none;
  }

  @keyframes heatWave {
    0%, 100% { transform: scaleY(1); }
    50% { transform: scaleY(1.05); }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .hero-logo { font-size: 48px; }
    .hero-tagline { font-size: 18px; }
    .boot-logo { font-size: 36px; }
    .cta-group { flex-direction: column; align-items: center; }
    .btn { width: 100%; max-width: 300px; justify-content: center; }
  }
`

export default VolcanicLanding
