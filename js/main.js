import * as THREE from 'three';
import { GAME_CONFIG } from './config.js';
import { createWorld } from './world.js';
import { PhysicsEngine } from './physics-engine.js';
import { Courier } from './courier.js';
import { Parcel } from './parcel.js';
import { InputManager } from './input.js';
import { CameraController } from './camera-controller.js';
import { ProceduralLevelBuilder, DIFFICULTY_LEVELS } from './level-generator.js';
import { UIManager } from './ui.js';
import { ScoringSystem } from './scoring-system.js';
import { RankingSystem } from './ranking-system.js';
import { EndScreen } from './ui/end-screen.js';

const GameState = {
  isRunning: false,
  isPaused: false,
  currentLevel: 1,
  levelCompleted: false,
  restartShown: false,
  recordBrokenShown: false,
  player: {
    health: 100,
  },
  package: {
    health: 100,
  },
  startTime: 0,
  elapsedTime: 0,
};

const LevelNames = {
  [DIFFICULTY_LEVELS.EASY]: ['First Steps', 'Getting Started', 'Easy Delivery'],
  [DIFFICULTY_LEVELS.MEDIUM]: ['Parkour Pro', 'Challenge Accepted', 'Medium Rare'],
  [DIFFICULTY_LEVELS.HARD]: ['Hard Way', 'Expert Route', 'No Mercy'],
  [DIFFICULTY_LEVELS.EXTREME]: ['Impossible', 'Nightmare', 'Are You Crazy?'],
};

function init() {
  const canvas = document.getElementById('gameCanvas');
  
  const world = createWorld({ canvas });
  const physics = new PhysicsEngine();
  const levelBuilder = new ProceduralLevelBuilder(physics, world.scene);
  const uiManager = new UIManager();
  const rankingSystem = new RankingSystem();
  const scoringSystem = new ScoringSystem();
  
  const levelData = levelBuilder.buildLevel(GAME_CONFIG.LEVEL.START_LEVEL);
  
  const courier = new Courier(physics, world.scene);
  courier.createRagdoll(levelData.startPosition.clone().add(new THREE.Vector3(0, 2, 0)));
  
  const parcel = new Parcel(physics, world.scene);
  parcel.createParcel(courier.getPosition().add(new THREE.Vector3(0, 0.5, 0.2)));
  parcel.attachToCourier(courier.bodies.body, new THREE.Vector3(0, 0.5, 0.2));
  
  const inputManager = new InputManager();
  const cameraController = new CameraController(world.camera, courier);
  
  // Create end screen
  const hudContainer = document.getElementById('hud');
  const endScreen = new EndScreen(hudContainer, rankingSystem, scoringSystem);
  
  // Initialize record display
  const recordTime = rankingSystem.getRecordTime();
  const recordHolder = rankingSystem.getRecordHolder();
  uiManager.updateRecordDisplay(recordTime, recordHolder);
  
  // Show ghost if there's a record
  if (recordTime !== Infinity) {
    uiManager.showGhost();
  }
  
  GameState.onParcelExploded = () => {
    cameraController.shake(0.8, 0.5);
    console.log('Parcel Exploded!');
  };

  parcel.onExplode = GameState.onParcelExploded;

  const initialTime = performance.now();
  let lastTime = initialTime;
  GameState.isRunning = true;
  GameState.startTime = initialTime;

  physics.world.addEventListener('postStep', () => {
    const contacts = physics.world.contacts;
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      if (parcel.body && (contact.bi === parcel.body || contact.bj === parcel.body)) {
        const impact = Math.abs(contact.getImpactVelocityAlongNormal());
        if (impact > 2) {
          const damage = impact * GAME_CONFIG.PACKAGE.DAMAGE_MULTIPLIER;
          parcel.takeDamage(damage);
        }
      }
    }
  });
  
  console.log('Three.js loaded successfully');
  console.log('Cannon.js physics engine initialized');
  console.log('Courier ragdoll created');
  console.log('Level generated:', levelData.levelNumber, '- Difficulty:', levelData.difficulty);
  console.log('Game configuration:', GAME_CONFIG);
  
  function checkDelivery() {
    if (GameState.levelCompleted) return;
    
    const playerPos = courier.getPosition();
    if (levelBuilder.checkDeliveryReached(playerPos)) {
      GameState.levelCompleted = true;
      GameState.elapsedTime = (performance.now() - GameState.startTime) / 1000;
      console.log('Delivery completed! Level', GameState.currentLevel, 'finished!');
      
      // Calculate final score
      const timePar = GAME_CONFIG.SCORING.TIME_PAR;
      scoringSystem.timeBonus = scoringSystem.calculateTimeBonus(GameState.elapsedTime, timePar);
      scoringSystem.integrityMultiplier = scoringSystem.calculateIntegrityMultiplier(
        parcel.getHealth(), 
        parcel.maxHealth
      );
      
      const scoreData = scoringSystem.getScoreBreakdown();
      
      // Show victory screen
      endScreen.showVictory(
        scoreData,
        GameState.elapsedTime,
        scoringSystem.integrityMultiplier,
        GameState.currentLevel,
        () => nextLevel(levelBuilder, courier, parcel, physics, world.scene, uiManager, scoringSystem, endScreen),
        () => restartLevel(levelBuilder, courier, parcel, physics, world.scene, uiManager, scoringSystem, endScreen),
        () => { /* Menu callback */ }
      );
    }
  }

  function nextLevel(levelBuilder, courier, parcel, physics, scene, uiManager, scoringSystem, endScreen) {
    GameState.currentLevel++;
    GameState.levelCompleted = false;
    
    const newLevelData = levelBuilder.buildLevel(GameState.currentLevel);
    
    courier.dispose();
    courier.createRagdoll(newLevelData.startPosition.clone().add(new THREE.Vector3(0, 2, 0)));
    
    parcel.dispose();
    parcel.createParcel(courier.getPosition().add(new THREE.Vector3(0, 0.5, 0.2)));
    parcel.attachToCourier(courier.bodies.body, new THREE.Vector3(0, 0.5, 0.2));
    
    const difficultyNames = LevelNames[newLevelData.difficulty] || LevelNames[DIFFICULTY_LEVELS.EASY];
    const levelName = difficultyNames[Math.floor(Math.random() * difficultyNames.length)];
    
    console.log('Level', GameState.currentLevel, 'started:', levelName, '- Difficulty:', newLevelData.difficulty);
    
    uiManager.showLevelInfo(GameState.currentLevel, newLevelData.difficulty);
    
    // Reset scoring system for new level
    scoringSystem.reset();
    endScreen.reset();
    GameState.startTime = performance.now();
    GameState.recordBrokenShown = false;
  }

  window.nextLevel = () => nextLevel(levelBuilder, courier, parcel, physics, world.scene, uiManager, scoringSystem, endScreen);
  window.restartLevel = () => restartLevel(levelBuilder, courier, parcel, physics, world.scene, uiManager, scoringSystem, endScreen);
  
  function restartLevel(levelBuilder, courier, parcel, physics, scene, uiManager, scoringSystem, endScreen) {
    levelBuilder.clearLevel();
    const newLevelData = levelBuilder.buildLevel(GameState.currentLevel);
    
    courier.dispose();
    courier.createRagdoll(newLevelData.startPosition.clone().add(new THREE.Vector3(0, 2, 0)));
    
    parcel.dispose();
    parcel.createParcel(courier.getPosition().add(new THREE.Vector3(0, 0.5, 0.2)));
    parcel.attachToCourier(courier.bodies.body, new THREE.Vector3(0, 0.5, 0.2));
    
    GameState.levelCompleted = false;
    GameState.restartShown = false;
    uiManager.reset();
    
    // Reset scoring and end screen
    scoringSystem.reset();
    endScreen.reset();
    GameState.startTime = performance.now();
    GameState.recordBrokenShown = false;
    
    console.log('Level', GameState.currentLevel, 'restarted');
  }

  uiManager.showLevelInfo(GameState.currentLevel, levelData.difficulty);
  uiManager.onRestartBtnClick(() => window.restartLevel());

  document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyR' && parcel.isExploded) {
      window.restartLevel();
    }
  });

  function gameLoop(currentTime) {
    if (!GameState.isRunning) return;
    
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    if (!GameState.isPaused) {
      const mouseDelta = inputManager.getMouseDelta();
      cameraController.handleMouseInput(mouseDelta);
      
      const wheelDelta = inputManager.getWheelDelta();
      if (wheelDelta !== 0) {
        cameraController.handleWheelInput(wheelDelta);
      }
      
      const cameraDirection = cameraController.getCameraDirection();
      courier.applyInput(inputManager, deltaTime, cameraDirection);
      
      physics.step(deltaTime);
      
      courier.update(deltaTime);
      parcel.update(deltaTime);
      GameState.package.health = parcel.getHealth();
      cameraController.update(deltaTime);
      
      // Update aerial stunt detection
      scoringSystem.updateAerialDetection(courier, deltaTime);
      
      uiManager.update(deltaTime, parcel.getHealth(), parcel.maxHealth);
      
      // Update ghost time
      const currentTime = (performance.now() - GameState.startTime) / 1000;
      uiManager.updateGhostTime(currentTime);
      
      // Check if we're close to or beating the record
      const recordTime = rankingSystem.getRecordTime();
      if (recordTime !== Infinity && currentTime > 0) {
        const timeDifference = recordTime - currentTime;
        
        // If we're within 5 seconds of the record, show "almost" message
        if (timeDifference < 5 && timeDifference > 0) {
          // This would be handled by CSS/visual feedback
        }
        
        // If we beat the record
        if (currentTime < recordTime && !GameState.recordBrokenShown) {
          GameState.recordBrokenShown = true;
          uiManager.showRecordBroken();
        }
      }
      
      if (parcel.isExploded && !GameState.restartShown) {
        GameState.restartShown = true;
        GameState.elapsedTime = (performance.now() - GameState.startTime) / 1000;
        
        // Show defeat screen
        endScreen.showDefeat(
          GameState.elapsedTime,
          scoringSystem.calculateIntegrityMultiplier(parcel.getHealth(), parcel.maxHealth),
          () => restartLevel(levelBuilder, courier, parcel, physics, world.scene, uiManager, scoringSystem, endScreen),
          () => { /* Menu callback */ }
        );
      }
      
      checkDelivery();
    }
    
    world.renderer.render(world.scene, world.camera);
    
    requestAnimationFrame(gameLoop);
  }
  
  requestAnimationFrame(gameLoop);
  
  console.log('Game loop started at target FPS:', GAME_CONFIG.FPS);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
