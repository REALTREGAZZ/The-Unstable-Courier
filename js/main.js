import * as THREE from 'three';
import { GAME_CONFIG } from './config.js';
import { createWorld } from './world.js';
import { PhysicsEngine } from './physics-engine.js';
import { Courier } from './courier.js';
import { InputManager } from './input.js';
import { CameraController } from './camera-controller.js';
import { createGround } from './ground.js';

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
  
  const ground = createGround(physics, world.scene);
  
  const courier = new Courier(physics, world.scene);
  courier.createRagdoll(new THREE.Vector3(0, 5, 0));
  
  const inputManager = new InputManager();
  const cameraController = new CameraController(world.camera, courier);
  
  let lastTime = performance.now();
  
  console.log('Three.js loaded successfully');
  console.log('Cannon.js physics engine initialized');
  console.log('Courier ragdoll created');
  console.log('Game configuration:', GAME_CONFIG);
  
  GameState.isRunning = true;

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
      cameraController.update();
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
