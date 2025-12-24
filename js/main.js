import * as THREE from 'three';
import { GAME_CONFIG } from './config.js';
import { createWorld } from './world.js';
import { PhysicsEngine } from './physics-engine.js';
import { Courier } from './courier.js';
import { Parcel } from './parcel.js';
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
  
  const parcel = new Parcel(physics, world.scene);
  parcel.createParcel(courier.getPosition().add(new THREE.Vector3(0, 0.5, 0.2)));
  parcel.attachToCourier(courier.bodies.body, new THREE.Vector3(0, 0.5, 0.2));
  
  const inputManager = new InputManager();
  const cameraController = new CameraController(world.camera, courier);
  
  GameState.onParcelExploded = () => {
    cameraController.shake(0.8, 0.5);
    // You could add sound effects here if an AudioManager existed
    console.log('Parcel Exploded!');
  };

  parcel.onExplode = GameState.onParcelExploded;

  // Setup collision detection for parcel damage
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
      parcel.update(deltaTime);
      GameState.package.health = parcel.getHealth();
      cameraController.update(deltaTime);
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
