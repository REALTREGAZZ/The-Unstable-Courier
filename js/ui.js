export class UIManager {
  constructor() {
    this.timerValue = document.getElementById('timerValue');
    this.packageHealthBar = document.getElementById('packageHealthBar');
    this.packageHealthPercent = document.getElementById('packageHealthPercent');
    this.scoreValue = document.getElementById('scoreValue');
    this.levelInfo = document.getElementById('levelInfo');
    this.feedbackSection = document.getElementById('feedbackSection');
    this.restartSection = document.getElementById('restartSection');
    this.restartBtn = document.getElementById('restartBtn');
    this.failMessage = document.getElementById('failMessage');
    this.recordValue = document.getElementById('recordValue');
    this.recordHolder = document.getElementById('recordHolder');
    this.ghostTime = document.getElementById('ghostTime');
    this.recordGhost = document.getElementById('recordGhost');
    this.recordBroken = document.getElementById('recordBroken');
    
    this.elapsedTime = 0;
    this.score = 0;
    this.currentLevel = 1;
    this.currentDifficulty = 0.3;
  }
  
  update(deltaTime, parcelHealth, parcelMaxHealth) {
    this.elapsedTime += deltaTime;
    this.updateTimer();
    this.updatePackageHealth(parcelHealth, parcelMaxHealth);
    this.updateScore();
  }
  
  updateTimer() {
    const minutes = Math.floor(this.elapsedTime / 60);
    const seconds = Math.floor(this.elapsedTime % 60);
    
    const timerStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    this.timerValue.textContent = timerStr;
  }
  
  updatePackageHealth(health, maxHealth) {
    const healthPercent = (health / maxHealth) * 100;
    
    this.packageHealthBar.style.width = healthPercent + '%';
    
    if (healthPercent > 70) {
      this.packageHealthBar.style.background = 'linear-gradient(90deg, #00ff00, #ffcc00)';
    } else if (healthPercent > 30) {
      this.packageHealthBar.style.background = 'linear-gradient(90deg, #ffcc00, #ff6600)';
    } else {
      this.packageHealthBar.style.background = '#ff0000';
    }
    
    this.packageHealthPercent.textContent = Math.ceil(healthPercent) + '%';
  }
  
  updateScore() {
    const timeBonus = Math.max(0, 1000 - Math.floor(this.elapsedTime * 10));
    const levelBonus = this.currentLevel * 500;
    
    this.score = timeBonus + levelBonus;
    this.scoreValue.textContent = this.score;
  }
  
  showMessage(text, type = 'info') {
    const message = document.createElement('div');
    message.className = `feedback-message ${type}`;
    message.textContent = text;
    
    this.feedbackSection.appendChild(message);
    
    setTimeout(() => {
      message.remove();
    }, 2000);
  }
  
  showLevelInfo(levelNumber, difficulty) {
    this.currentLevel = levelNumber;
    this.currentDifficulty = difficulty;
    
    const difficultyText = difficulty === 1 ? 'Fácil' : difficulty === 2 ? 'Normal' : difficulty === 3 ? 'Difícil' : 'Extrema';
    this.levelInfo.textContent = `Nivel ${levelNumber} - Dificultad: ${difficultyText}`;
    
    const section = document.getElementById('levelInfo').parentElement;
    section.classList.add('show');
    
    setTimeout(() => {
      section.classList.remove('show');
    }, 2000);
  }
  
  showParcelExploded() {
    this.failMessage.textContent = '¡El paquete explotó!';
    this.restartSection.classList.remove('hidden');
    this.showMessage('El paquete explotó. Presiona R para reintentar.', 'error');
  }
  
  showParcelDelivered() {
    this.restartSection.classList.add('hidden');
    this.showMessage('¡Entrega exitosa! Siguiente nivel...', 'success');
  }
  
  updateRecordDisplay(recordTime, recordHolder) {
    if (recordTime === Infinity) {
      this.recordValue.textContent = '--.--s';
      this.recordHolder.textContent = '---';
    } else {
      this.recordValue.textContent = `${recordTime.toFixed(2)}s`;
      this.recordHolder.textContent = recordHolder || '---';
    }
  }
  
  updateGhostTime(elapsedTime) {
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = Math.floor(elapsedTime % 60);
    this.ghostTime.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  
  showGhost() {
    this.recordGhost.classList.remove('hidden');
  }
  
  hideGhost() {
    this.recordGhost.classList.add('hidden');
  }
  
  showRecordBroken() {
    this.recordBroken.classList.remove('hidden');
    setTimeout(() => {
      this.recordBroken.classList.add('hidden');
    }, 2000);
  }
  
  reset() {
    this.elapsedTime = 0;
    this.score = 0;
    this.timerValue.textContent = '00:00';
    this.scoreValue.textContent = '0';
    this.restartSection.classList.add('hidden');
    this.hideGhost();
    
    this.feedbackSection.innerHTML = '';
  }
  
  onRestartBtnClick(callback) {
    this.restartBtn.addEventListener('click', callback);
  }
}
