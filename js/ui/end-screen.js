export class EndScreen {
  constructor(container, rankingSystem, scoringSystem) {
    this.container = container || document.body;
    this.rankingSystem = rankingSystem;
    this.scoringSystem = scoringSystem;
    this.isVisible = false;
    
    // Create end screen elements
    this.createEndScreenElements();
  }
  
  createEndScreenElements() {
    // Main end screen container
    this.endScreen = document.createElement('div');
    this.endScreen.className = 'end-screen hidden';
    this.endScreen.id = 'endScreen';
    
    // Victory screen
    this.victoryScreen = document.createElement('div');
    this.victoryScreen.className = 'victory-screen';
    this.victoryScreen.innerHTML = `
      <div class="victory-content">
        <h1 class="victory-title">¡ENTREGA EXITOSA!</h1>
        <div class="score-breakdown">
          <div class="score-item"><span class="score-label">Puntos Base:</span><span class="score-value" id="basePoints">0</span></div>
          <div class="score-item"><span class="score-label">Bonus Tiempo:</span><span class="score-value" id="timeBonus">0</span></div>
          <div class="score-item"><span class="score-label">Bonus Estilo:</span><span class="score-value" id="styleBonus">0</span></div>
          <div class="score-item"><span class="score-label">Multiplicador Integridad:</span><span class="score-value" id="integrityMultiplier">×1.0</span></div>
          <div class="score-item total"><span class="score-label">PUNTOS TOTALES:</span><span class="score-value" id="totalScore">0</span></div>
        </div>
        <div class="ranking-info" id="rankingInfo"></div>
        <div class="name-input-section hidden" id="nameInputSection">
          <h3>¡NUEVO RÉCORD!</h3>
          <p>Ingresa tu nombre (3 letras):</p>
          <input type="text" id="playerNameInput" maxlength="3" pattern="[A-Z]{3}" placeholder="ABC">
          <button id="saveNameBtn">GUARDAR</button>
        </div>
        <div class="end-screen-buttons">
          <button id="shareBtn" class="end-btn">COMPARTIR [C]</button>
          <button id="nextLevelBtn" class="end-btn">SIGUIENTE NIVEL [SPACE]</button>
          <button id="retryBtn" class="end-btn">REINTENTAR [R]</button>
          <button id="menuBtn" class="end-btn">MENÚ [ESC]</button>
        </div>
      </div>
    `;
    
    // Defeat screen
    this.defeatScreen = document.createElement('div');
    this.defeatScreen.className = 'defeat-screen';
    this.defeatScreen.innerHTML = `
      <div class="defeat-content">
        <h1 class="defeat-title">¡PAQUETE DESTRUIDO!</h1>
        <div class="defeat-info">
          <div class="info-item"><span class="info-label">Tiempo:</span><span class="info-value" id="defeatTime">00:00</span></div>
          <div class="info-item"><span class="info-label">Integridad:</span><span class="info-value" id="defeatIntegrity">0%</span></div>
          <div class="info-item"><span class="info-label">Puntuación:</span><span class="info-value" id="defeatScore">0</span></div>
        </div>
        <div class="defeat-message" id="defeatMessage"></div>
        <div class="end-screen-buttons">
          <button id="defeatRetryBtn" class="end-btn">REINTENTAR [R]</button>
          <button id="defeatMenuBtn" class="end-btn">MENÚ [ESC]</button>
        </div>
      </div>
    `;
    
    this.endScreen.appendChild(this.victoryScreen);
    this.endScreen.appendChild(this.defeatScreen);
    this.container.appendChild(this.endScreen);
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Victory screen buttons
    this.endScreen.querySelector('#shareBtn')?.addEventListener('click', () => this.handleShare());
    this.endScreen.querySelector('#nextLevelBtn')?.addEventListener('click', () => this.handleNextLevel());
    this.endScreen.querySelector('#retryBtn')?.addEventListener('click', () => this.handleRetry());
    this.endScreen.querySelector('#menuBtn')?.addEventListener('click', () => this.handleMenu());
    
    // Defeat screen buttons
    this.endScreen.querySelector('#defeatRetryBtn')?.addEventListener('click', () => this.handleRetry());
    this.endScreen.querySelector('#defeatMenuBtn')?.addEventListener('click', () => this.handleMenu());
    
    // Name input
    this.endScreen.querySelector('#saveNameBtn')?.addEventListener('click', () => this.handleSaveName());
    this.endScreen.querySelector('#playerNameInput')?.addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (!this.isVisible) return;
      
      if (e.code === 'KeyR') {
        this.handleRetry();
      } else if (e.code === 'KeyC') {
        this.handleShare();
      } else if (e.code === 'Space') {
        this.handleNextLevel();
      } else if (e.code === 'Escape') {
        this.handleMenu();
      } else if (e.code === 'Enter' && this.endScreen.querySelector('#nameInputSection:not(.hidden)')) {
        this.handleSaveName();
      }
    });
  }
  
  showVictory(scoreData, elapsedTime, integrityPercent, levelNumber, onNextLevel, onRetry, onMenu) {
    this.isVisible = true;
    this.victoryScreen.classList.remove('hidden');
    this.defeatScreen.classList.add('hidden');
    this.endScreen.classList.remove('hidden');
    
    // Store callbacks and elapsed time
    this.onNextLevel = onNextLevel;
    this.onRetry = onRetry;
    this.onMenu = onMenu;
    this.elapsedTime = elapsedTime;
    
    // Update score breakdown
    const basePointsEl = this.endScreen.querySelector('#basePoints');
    const timeBonusEl = this.endScreen.querySelector('#timeBonus');
    const styleBonusEl = this.endScreen.querySelector('#styleBonus');
    const integrityMultiplierEl = this.endScreen.querySelector('#integrityMultiplier');
    const totalScoreEl = this.endScreen.querySelector('#totalScore');
    
    if (basePointsEl) basePointsEl.textContent = scoreData.basePoints;
    if (timeBonusEl) timeBonusEl.textContent = scoreData.timeBonus >= 0 ? `+${scoreData.timeBonus}` : scoreData.timeBonus;
    if (styleBonusEl) styleBonusEl.textContent = `+${scoreData.styleBonus}`;
    if (integrityMultiplierEl) integrityMultiplierEl.textContent = `×${scoreData.integrityMultiplier.toFixed(1)}`;
    if (totalScoreEl) totalScoreEl.textContent = scoreData.finalScore;
    
    // Check if this is a top score
    const isTopScore = this.rankingSystem.isTopScore(scoreData.finalScore);
    const rankingInfo = this.endScreen.querySelector('#rankingInfo');
    const nameInputSection = this.endScreen.querySelector('#nameInputSection');
    
    if (isTopScore) {
      if (rankingInfo) {
        rankingInfo.innerHTML = `<p class="top-score">🏆 ¡NUEVO RÉCORD! #${Math.min(5, this.rankingSystem.getTopScores().length + 1)} EN EL RANKING</p>`;
      }
      if (nameInputSection) {
        nameInputSection.classList.remove('hidden');
      }
      
      // Focus on name input
      setTimeout(() => {
        const playerNameInput = this.endScreen.querySelector('#playerNameInput');
        if (playerNameInput) {
          playerNameInput.focus();
        }
      }, 100);
    } else {
      const neededScore = this.rankingSystem.getScoreNeededForTop5();
      if (rankingInfo) {
        rankingInfo.innerHTML = `<p>Necesitas ${neededScore} puntos para entrar al top 5</p>`;
      }
      if (nameInputSection) {
        nameInputSection.classList.add('hidden');
      }
    }
    
    // Show appropriate buttons based on level
    const nextLevelBtn = this.endScreen.querySelector('#nextLevelBtn');
    const retryBtn = this.endScreen.querySelector('#retryBtn');
    
    if (nextLevelBtn && retryBtn) {
      if (levelNumber < 20) { // Assuming max level is 20
        nextLevelBtn.classList.remove('hidden');
        retryBtn.classList.add('hidden');
      } else {
        nextLevelBtn.classList.add('hidden');
        retryBtn.classList.remove('hidden');
      }
    }
  }
  
  showDefeat(elapsedTime, integrityPercent, onRetry, onMenu) {
    this.isVisible = true;
    this.victoryScreen.classList.add('hidden');
    this.defeatScreen.classList.remove('hidden');
    this.endScreen.classList.remove('hidden');
    
    // Store callbacks
    this.onRetry = onRetry;
    this.onMenu = onMenu;
    
    // Update defeat info
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = Math.floor(elapsedTime % 60);
    const defeatTimeEl = this.endScreen.querySelector('#defeatTime');
    const defeatIntegrityEl = this.endScreen.querySelector('#defeatIntegrity');
    const defeatScoreEl = this.endScreen.querySelector('#defeatScore');
    
    if (defeatTimeEl) defeatTimeEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    if (defeatIntegrityEl) defeatIntegrityEl.textContent = `${Math.floor(integrityPercent * 100)}%`;
    if (defeatScoreEl) defeatScoreEl.textContent = '0';
    
    // Random sarcastic message
    const messages = [
      '¡Tu carrera ha explotado!',
      'Mejor suerte la próxima...',
      'Eso dolió. ¿Otra vez?',
      'El paquete no sobrevivió...',
      '¡Fracaso épico!'
    ];
    this.endScreen.querySelector('#defeatMessage').textContent = messages[Math.floor(Math.random() * messages.length)];
  }
  
  handleSaveName() {
    const nameInput = this.endScreen.querySelector('#playerNameInput');
    const name = nameInput?.value;
    
    if (name && this.rankingSystem.isValidName(name)) {
      // Get score data from scoring system
      const scoreData = this.scoringSystem.getScoreBreakdown();
      
      // Use the stored elapsed time
      const elapsedTime = this.elapsedTime || 60;
      
      this.rankingSystem.saveScore(name, scoreData.finalScore, scoreData.integrityMultiplier, elapsedTime);
      
      // Hide name input
      this.endScreen.querySelector('#nameInputSection')?.classList.add('hidden');
      
      // Update ranking info
      const rankingInfo = this.endScreen.querySelector('#rankingInfo');
      rankingInfo.innerHTML = `<p class="top-score">🏆 ¡RÉCORD GUARDADO! Posición #${this.rankingSystem.getTopScores().findIndex(s => s.name === name) + 1}</p>`;
    } else {
      alert('Por favor ingresa un nombre válido (3 letras mayúsculas)');
    }
  }
  
  handleShare() {
    // Copy score to clipboard or show share dialog
    const scoreData = this.scoringSystem.getScoreBreakdown();
    const shareText = `¡Acabo de obtener ${scoreData.finalScore} puntos en The Unstable Courier! ¿Puedes superarlo?`;
    
    if (navigator.share) {
      navigator.share({
        title: 'The Unstable Courier',
        text: shareText,
        url: window.location.href
      }).catch(err => console.log('Error sharing:', err));
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText).then(() => {
        alert('¡Puntuación copiada al portapapeles!');
      }).catch(err => {
        console.error('Error copying to clipboard:', err);
      });
    }
  }
  
  handleNextLevel() {
    this.hide();
    if (this.onNextLevel) {
      this.onNextLevel();
    }
  }
  
  handleRetry() {
    this.hide();
    if (this.onRetry) {
      this.onRetry();
    }
  }
  
  handleMenu() {
    this.hide();
    if (this.onMenu) {
      this.onMenu();
    }
  }
  
  hide() {
    this.isVisible = false;
    this.endScreen.classList.add('hidden');
  }
  
  reset() {
    this.hide();
    const nameInputSection = this.endScreen.querySelector('#nameInputSection');
    if (nameInputSection) {
      nameInputSection.classList.add('hidden');
    }
    const playerNameInput = this.endScreen.querySelector('#playerNameInput');
    if (playerNameInput) {
      playerNameInput.value = '';
    }
  }
}