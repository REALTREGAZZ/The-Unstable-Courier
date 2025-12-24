import * as CANNON from 'cannon-es';
import { GAME_CONFIG } from './config.js';

export class ScoringSystem {
  constructor(basePoints = GAME_CONFIG.SCORING.BASE_POINTS) {
    this.basePoints = basePoints;
    this.integrityMultiplier = 1.0;
    this.timeBonus = 0;
    this.styleBonus = 0;
    this.aerialStunts = 0;
    this.maxAerialStunts = GAME_CONFIG.SCORING.MAX_STUNTS_PER_LEVEL;
    
    // Track aerial stunt detection
    this.isInAir = false;
    this.airTime = 0;
    this.lastYaw = 0;
    this.rotationDetected = false;
    
    // Reusable vector for Euler angle calculations
    this.eulerVector = new CANNON.Vec3();
  }
  
  calculateIntegrityMultiplier(currentHealth, maxHealth) {
    if (currentHealth <= 0) {
      return 0;
    }
    return Math.max(0, Math.min(1, currentHealth / maxHealth));
  }
  
  calculateTimeBonus(elapsedTime, timePar) {
    const timeDifference = timePar - elapsedTime;
    const bonus = timeDifference * 100; // 100 points per second saved
    return Math.max(-1000, bonus); // Cap negative bonus at -1000
  }
  
  addStyleBonus(value) {
    if (this.aerialStunts < this.maxAerialStunts) {
      this.styleBonus += GAME_CONFIG.SCORING.STYLE_BONUS_PER_STUNT;
      this.aerialStunts++;
    }
  }
  
  getFinalScore() {
    const integrityMultiplier = this.integrityMultiplier;
    const baseWithBonuses = this.basePoints + this.timeBonus + this.styleBonus;
    return Math.max(0, Math.floor(baseWithBonuses * integrityMultiplier));
  }
  
  getScoreBreakdown() {
    return {
      basePoints: this.basePoints,
      timeBonus: this.timeBonus,
      styleBonus: this.styleBonus,
      integrityMultiplier: this.integrityMultiplier,
      finalScore: this.getFinalScore()
    };
  }
  
  updateAerialDetection(courier, deltaTime) {
    const body = courier.bodies.body;
    body.quaternion.toEuler(this.eulerVector);
    const currentYaw = this.eulerVector.y;
    
    // Check if in air (both feet above ground)
    const leftFootY = courier.bodies.leftFoot.position.y;
    const rightFootY = courier.bodies.rightFoot.position.y;
    const isCurrentlyInAir = leftFootY > 0.5 && rightFootY > 0.5;
    
    if (isCurrentlyInAir) {
      if (!this.isInAir) {
        // Just entered air
        this.isInAir = true;
        this.airTime = 0;
        this.lastYaw = currentYaw;
        this.rotationDetected = false;
      } else {
        // Already in air, track time and rotation
        this.airTime += deltaTime;
        
        // Check for significant rotation (more than 0.5 radians)
        const yawDelta = Math.abs(currentYaw - this.lastYaw);
        if (yawDelta > 0.5) {
          this.rotationDetected = true;
        }
      }
    } else {
      if (this.isInAir) {
        // Just landed
        this.isInAir = false;
        
        // Check if this was a valid stunt
        if (this.airTime > 1.0 && this.rotationDetected) {
          // Valid aerial stunt!
          this.addStyleBonus(250);
        }
      }
    }
  }
  
  reset() {
    this.integrityMultiplier = 1.0;
    this.timeBonus = 0;
    this.styleBonus = 0;
    this.aerialStunts = 0;
    this.isInAir = false;
    this.airTime = 0;
    this.lastYaw = 0;
    this.rotationDetected = false;
  }
}