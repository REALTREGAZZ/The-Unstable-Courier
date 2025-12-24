import * as THREE from 'three';
import { GAME_CONFIG } from './config.js';
import { createWorld } from './world.js';
import { PhysicsEngine } from './physics-engine.js';

const GameState = {
  isRunning: false,
  isPaused: false,
  player: {
    health: 100,
  },
  package: {
    health: 100,
  },
};

function init() {
  const canvas = document.getElementById('gameCanvas');
  
  const world = createWorld({ canvas });
  const physics = new PhysicsEngine();
  
  let lastTime = performance.now();
  
  console.log('Three.js loaded successfully');
  console.log('Cannon.js physics engine initialized');
  console.log('Game configuration:', GAME_CONFIG);
  
  GameState.isRunning = true;

  function gameLoop(currentTime) {
    if (!GameState.isRunning) return;
    
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    if (!GameState.isPaused) {
      physics.step(deltaTime);
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
