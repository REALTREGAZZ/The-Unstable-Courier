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

const GameState = {
  isRunning: false,
  isPaused: false,
  currentLevel: 1,
  levelCompleted: false,
  restartShown: false,
  player: {
    health: 100,
  },
  package: {
    health: 100,
  },
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
  
  const levelData = levelBuilder.buildLevel(GAME_CONFIG.LEVEL.START_LEVEL);
  
  const courier = new Courier(physics, world.scene);
  courier.createRagdoll(levelData.startPosition.clone().add(new THREE.Vector3(0, 2, 0)));
  
  const parcel = new Parcel(physics, world.scene);
  parcel.createParcel(courier.getPosition().add(new THREE.Vector3(0, 0.5, 0.2)));
  parcel.attachToCourier(courier.bodies.body, new THREE.Vector3(0, 0.5, 0.2));
  
  const inputManager = new InputManager();
  const cameraController = new CameraController(world.camera, courier);
  
  GameState.onParcelExploded = () => {
    cameraController.shake(0.8, 0.5);
    console.log('Parcel Exploded!');
  };

  parcel.onExplode = GameState.onParcelExploded;

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

  let lastTime = performance.now();
  
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
      console.log('Delivery completed! Level', GameState.currentLevel, 'finished!');
      uiManager.showParcelDelivered();
      
      setTimeout(() => {
        if (GameState.currentLevel < GAME_CONFIG.LEVEL.MAX_LEVEL) {
          nextLevel(levelBuilder, courier, parcel, physics, world.scene, uiManager);
        } else {
          console.log('All levels completed! Congratulations!');
          uiManager.showMessage('¡Todos los niveles completados! ¡Felicidades!', 'success');
        }
      }, 2000);
    }
  }

  function nextLevel(levelBuilder, courier, parcel, physics, scene, uiManager) {
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
  }

  window.nextLevel = () => nextLevel(levelBuilder, courier, parcel, physics, world.scene, uiManager);
  window.restartLevel = () => {
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
    console.log('Level', GameState.currentLevel, 'restarted');
  };

  GameState.isRunning = true;

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
      
      uiManager.update(deltaTime, parcel.getHealth(), parcel.maxHealth);
      
      if (parcel.isExploded && !GameState.restartShown) {
        uiManager.showParcelExploded();
        GameState.restartShown = true;
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
