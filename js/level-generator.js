import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export const MODULE_TYPES = {
  PLATFORM: 'platform',
  RAMP_UP: 'ramp_up',
  RAMP_DOWN: 'ramp_down',
  JUMP: 'jump',
  TURN_LEFT: 'turn_left',
  TURN_RIGHT: 'turn_right',
  ABYSS: 'abyss',
  DELIVERY_ZONE: 'delivery_zone',
};

export const DIFFICULTY_LEVELS = {
  EASY: 1,
  MEDIUM: 2,
  HARD: 3,
  EXTREME: 4,
};

const MODULE_CONFIG = {
  [MODULE_TYPES.PLATFORM]: {
    width: 4,
    depth: 6,
    height: 0.5,
    color: 0x4a90a4,
  },
  [MODULE_TYPES.RAMP_UP]: {
    width: 4,
    depth: 8,
    height: 0.5,
    riseHeight: 3,
    color: 0x5ba0b4,
  },
  [MODULE_TYPES.RAMP_DOWN]: {
    width: 4,
    depth: 8,
    height: 0.5,
    dropHeight: 3,
    color: 0x5ba0b4,
  },
  [MODULE_TYPES.JUMP]: {
    width: 4,
    depth: 3,
    gapWidth: 3,
    color: 0xe67e22,
  },
  [MODULE_TYPES.TURN_LEFT]: {
    width: 6,
    depth: 6,
    turnAngle: Math.PI / 2,
    color: 0x9b59b6,
  },
  [MODULE_TYPES.TURN_RIGHT]: {
    width: 6,
    depth: 6,
    turnAngle: -Math.PI / 2,
    color: 0x9b59b6,
  },
  [MODULE_TYPES.ABYSS]: {
    width: 6,
    depth: 10,
    gapWidth: 15,
    color: 0xc0392b,
  },
  [MODULE_TYPES.DELIVERY_ZONE]: {
    width: 5,
    depth: 5,
    height: 0.3,
    color: 0x2ecc71,
  },
};

export class LevelModule {
  constructor(type, config = {}) {
    this.type = type;
    this.config = { ...MODULE_CONFIG[type], ...config };
    this.body = null;
    this.mesh = null;
    this.children = [];
  }
}

export class LevelGenerator {
  constructor() {
    this.modules = [];
    this.currentPosition = new THREE.Vector3(0, 0, 0);
    this.currentDirection = new THREE.Vector3(0, 0, 1);
    this.currentLevel = 1;
    this.difficulty = DIFFICULTY_LEVELS.EASY;
  }

  generateLevel(levelNumber = 1) {
    this.reset();
    this.currentLevel = levelNumber;
    this.difficulty = this.calculateDifficulty(levelNumber);
    
    const moduleCount = this.calculateModuleCount(levelNumber);
    
    this.createStartPlatform();
    
    for (let i = 0; i < moduleCount; i++) {
      this.addRandomModule();
    }
    
    this.createDeliveryZone();
    
    return {
      modules: this.modules,
      startPosition: new THREE.Vector3(0, 2, 0),
      deliveryPosition: this.currentPosition.clone().add(new THREE.Vector3(0, 2, 0)),
      levelNumber: this.currentLevel,
      difficulty: this.difficulty,
      seed: Date.now(),
    };
  }

  reset() {
    this.modules = [];
    this.currentPosition = new THREE.Vector3(0, 0, 0);
    this.currentDirection = new THREE.Vector3(0, 0, 1);
    this.currentLevel = 1;
    this.difficulty = DIFFICULTY_LEVELS.EASY;
  }

  calculateDifficulty(levelNumber) {
    if (levelNumber <= 3) return DIFFICULTY_LEVELS.EASY;
    if (levelNumber <= 6) return DIFFICULTY_LEVELS.MEDIUM;
    if (levelNumber <= 9) return DIFFICULTY_LEVELS.HARD;
    return DIFFICULTY_LEVELS.EXTREME;
  }

  calculateModuleCount(levelNumber) {
    const baseCount = 8;
    const increment = Math.min(levelNumber, 12);
    return baseCount + increment;
  }

  getAvailableModules() {
    const baseModules = [
      MODULE_TYPES.PLATFORM,
      MODULE_TYPES.RAMP_UP,
      MODULE_TYPES.RAMP_DOWN,
      MODULE_TYPES.JUMP,
    ];

    const advancedModules = [
      MODULE_TYPES.TURN_LEFT,
      MODULE_TYPES.TURN_RIGHT,
      MODULE_TYPES.ABYSS,
    ];

    if (this.difficulty >= DIFFICULTY_LEVELS.MEDIUM) {
      return [...baseModules, ...advancedModules];
    }

    return baseModules;
  }

  getModuleWeights() {
    const weights = {
      [MODULE_TYPES.PLATFORM]: 40,
      [MODULE_TYPES.RAMP_UP]: 15,
      [MODULE_TYPES.RAMP_DOWN]: 15,
      [MODULE_TYPES.JUMP]: 20,
      [MODULE_TYPES.TURN_LEFT]: 5,
      [MODULE_TYPES.TURN_RIGHT]: 5,
      [MODULE_TYPES.ABYSS]: 0,
    };

    if (this.difficulty >= DIFFICULTY_LEVELS.MEDIUM) {
      weights[MODULE_TYPES.JUMP] = 25;
      weights[MODULE_TYPES.ABYSS] = 10;
      weights[MODULE_TYPES.TURN_LEFT] = 8;
      weights[MODULE_TYPES.TURN_RIGHT] = 8;
      weights[MODULE_TYPES.PLATFORM] = 34;
    }

    if (this.difficulty >= DIFFICULTY_LEVELS.HARD) {
      weights[MODULE_TYPES.JUMP] = 30;
      weights[MODULE_TYPES.ABYSS] = 15;
      weights[MODULE_TYPES.TURN_LEFT] = 10;
      weights[MODULE_TYPES.TURN_RIGHT] = 10;
      weights[MODULE_TYPES.RAMP_UP] = 20;
      weights[MODULE_TYPES.RAMP_DOWN] = 20;
      weights[MODULE_TYPES.PLATFORM] = 15;
    }

    if (this.difficulty >= DIFFICULTY_LEVELS.EXTREME) {
      weights[MODULE_TYPES.ABYSS] = 25;
      weights[MODULE_TYPES.JUMP] = 35;
      weights[MODULE_TYPES.PLATFORM] = 5;
      weights[MODULE_TYPES.RAMP_UP] = 15;
      weights[MODULE_TYPES.RAMP_DOWN] = 15;
    }

    return weights;
  }

  selectRandomModule() {
    const availableModules = this.getAvailableModules();
    const weights = this.getModuleWeights();
    
    const totalWeight = availableModules.reduce((sum, mod) => sum + (weights[mod] || 1), 0);
    let random = Math.random() * totalWeight;
    
    for (const mod of availableModules) {
      random -= weights[mod];
      if (random <= 0) {
        return mod;
      }
    }
    
    return availableModules[0];
  }

  addRandomModule() {
    const moduleType = this.selectRandomModule();
    this.addModule(moduleType);
  }

  addModule(type, config = {}) {
    const module = new LevelModule(type, config);
    const lastPosition = this.currentPosition.clone();
    
    this.calculateModulePlacement(module);
    
    module.startPosition = lastPosition.clone();
    module.endPosition = this.currentPosition.clone();
    module.direction = this.currentDirection.clone();
    
    this.modules.push(module);
    
    return module;
  }

  calculateModulePlacement(module) {
    const spacing = 0.5;
    
    switch (module.type) {
      case MODULE_TYPES.PLATFORM:
        this.currentPosition.add(
          this.currentDirection.clone().multiplyScalar(module.config.depth + spacing)
        );
        break;
        
      case MODULE_TYPES.RAMP_UP:
        this.currentPosition.y += module.config.riseHeight;
        this.currentPosition.add(
          this.currentDirection.clone().multiplyScalar(module.config.depth + spacing)
        );
        break;
        
      case MODULE_TYPES.RAMP_DOWN:
        this.currentPosition.y -= module.config.dropHeight;
        this.currentPosition.add(
          this.currentDirection.clone().multiplyScalar(module.config.depth + spacing)
        );
        break;
        
      case MODULE_TYPES.JUMP:
        this.currentPosition.add(
          this.currentDirection.clone().multiplyScalar(module.config.depth + module.config.gapWidth + spacing)
        );
        break;
        
      case MODULE_TYPES.TURN_LEFT:
        this.rotateDirection(Math.PI / 2);
        this.currentPosition.add(
          this.currentDirection.clone().multiplyScalar(module.config.depth + spacing)
        );
        break;
        
      case MODULE_TYPES.TURN_RIGHT:
        this.rotateDirection(-Math.PI / 2);
        this.currentPosition.add(
          this.currentDirection.clone().multiplyScalar(module.config.depth + spacing)
        );
        break;
        
      case MODULE_TYPES.ABYSS:
        this.currentPosition.add(
          this.currentDirection.clone().multiplyScalar(module.config.depth + module.config.gapWidth + spacing)
        );
        break;
        
      case MODULE_TYPES.DELIVERY_ZONE:
        this.currentPosition.add(
          this.currentDirection.clone().multiplyScalar(module.config.depth / 2 + spacing)
        );
        break;
    }
    
    if (this.currentPosition.y < 0) {
      this.currentPosition.y = 0;
    }
  }

  rotateDirection(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const newX = this.currentDirection.x * cos - this.currentDirection.z * sin;
    const newZ = this.currentDirection.x * sin + this.currentDirection.z * cos;
    this.currentDirection.set(newX, 0, newZ).normalize();
  }

  createStartPlatform() {
    const startModule = new LevelModule(MODULE_TYPES.PLATFORM, {
      width: 6,
      depth: 8,
      height: 1,
      color: 0x27ae60,
    });
    startModule.startPosition = new THREE.Vector3(-3, 0, -4);
    startModule.endPosition = new THREE.Vector3(0, 0, 4);
    startModule.isStart = true;
    startModule.direction = new THREE.Vector3(0, 0, 1);
    this.modules.push(startModule);
    
    this.currentPosition.set(0, 0, 4);
  }

  createDeliveryZone() {
    const deliveryModule = new LevelModule(MODULE_TYPES.DELIVERY_ZONE, {
      width: 5 + this.currentLevel,
      depth: 5 + this.currentLevel,
      height: 0.5,
    });
    deliveryModule.startPosition = this.currentPosition.clone().sub(
      this.currentDirection.clone().multiplyScalar(2.5)
    );
    deliveryModule.endPosition = this.currentPosition.clone();
    deliveryModule.isDelivery = true;
    deliveryModule.direction = this.currentDirection.clone();
    this.modules.push(deliveryModule);
    
    this.currentPosition.add(
      this.currentDirection.clone().multiplyScalar(5)
    );
  }
}

export class ProceduralLevelBuilder {
  constructor(physicsEngine, scene) {
    this.physicsEngine = physicsEngine;
    this.scene = scene;
    this.generator = new LevelGenerator();
    this.levelObjects = [];
  }

  buildLevel(levelNumber = 1) {
    this.clearLevel();
    
    const levelData = this.generator.generateLevel(levelNumber);
    
    for (const module of levelData.modules) {
      this.buildModule(module);
    }
    
    return {
      startPosition: levelData.startPosition,
      deliveryPosition: levelData.deliveryPosition,
      levelNumber: levelData.levelNumber,
      difficulty: levelData.difficulty,
      modules: this.levelObjects,
    };
  }

  buildModule(module) {
    switch (module.type) {
      case MODULE_TYPES.PLATFORM:
        this.createPlatform(module);
        break;
      case MODULE_TYPES.RAMP_UP:
        this.createRamp(module, true);
        break;
      case MODULE_TYPES.RAMP_DOWN:
        this.createRamp(module, false);
        break;
      case MODULE_TYPES.JUMP:
        this.createJump(module);
        break;
      case MODULE_TYPES.TURN_LEFT:
      case MODULE_TYPES.TURN_RIGHT:
        this.createTurn(module);
        break;
      case MODULE_TYPES.ABYSS:
        this.createAbyss(module);
        break;
      case MODULE_TYPES.DELIVERY_ZONE:
        this.createDeliveryZone(module);
        break;
    }
  }

  createPlatform(module) {
    const { width, depth, height, color } = module.config;
    const startPos = module.startPosition || new THREE.Vector3();
    
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.7,
      metalness: 0.1,
    });
    const mesh = new THREE.Mesh(geometry, material);
    
    const position = startPos.clone().add(
      module.direction.clone().multiplyScalar(depth / 2)
    );
    position.y += height / 2;
    
    mesh.position.copy(position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    
    const shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
    const body = new CANNON.Body({
      mass: 0,
      shape: shape,
      position: new CANNON.Vec3(position.x, position.y, position.z),
    });
    this.physicsEngine.world.addBody(body);
    
    this.levelObjects.push({ mesh, body, module });
  }

  createRamp(module, isUp) {
    const { width, depth, riseHeight, dropHeight, color } = module.config;
    const startPos = module.startPosition || new THREE.Vector3();
    const height = isUp ? riseHeight : dropHeight;
    
    const geometry = new THREE.BoxGeometry(width, 0.5, depth);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.7,
      metalness: 0.1,
    });
    const mesh = new THREE.Mesh(geometry, material);
    
    const midZ = startPos.z + (depth / 2) * module.direction.z;
    const midX = startPos.x + (depth / 2) * module.direction.x;
    const midY = isUp ? height / 2 : -height / 2;
    
    const position = new THREE.Vector3(
      midX,
      startPos.y + Math.abs(height) / 2,
      midZ
    );
    
    mesh.position.copy(position);
    
    const angle = Math.atan2(height, depth);
    mesh.rotation.x = isUp ? -angle : angle;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    
    const shape = new CANNON.Box(new CANNON.Vec3(width / 2, 0.25, depth / 2));
    const body = new CANNON.Body({
      mass: 0,
      shape: shape,
      position: new CANNON.Vec3(position.x, position.y, position.z),
    });
    
    const quaternion = new CANNON.Quaternion();
    quaternion.setFromEuler(isUp ? -angle : angle, 0, 0);
    body.quaternion.copy(quaternion);
    
    this.physicsEngine.world.addBody(body);
    
    this.levelObjects.push({ mesh, body, module });
  }

  createJump(module) {
    const { width, gapWidth, color } = module.config;
    const startPos = module.startPosition || new THREE.Vector3();
    
    const leftWidth = width / 2 - 0.5;
    const rightWidth = width / 2 - 0.5;
    
    const leftGeometry = new THREE.BoxGeometry(leftWidth, 0.5, module.config.depth);
    const rightGeometry = new THREE.BoxGeometry(rightWidth, 0.5, module.config.depth);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.7,
      metalness: 0.1,
    });
    
    const leftMesh = new THREE.Mesh(leftGeometry, material);
    const rightMesh = new THREE.Mesh(rightGeometry, material);
    
    const basePosition = startPos.clone();
    basePosition.y += 0.25;
    
    const perpendicular = new THREE.Vector3(-module.direction.z, 0, module.direction.x);
    
    leftMesh.position.copy(basePosition).add(perpendicular.clone().multiplyScalar(width / 4));
    rightMesh.position.copy(basePosition).add(perpendicular.clone().multiplyScalar(-width / 4));
    
    leftMesh.castShadow = true;
    leftMesh.receiveShadow = true;
    rightMesh.castShadow = true;
    rightMesh.receiveShadow = true;
    
    this.scene.add(leftMesh);
    this.scene.add(rightMesh);
    
    const leftShape = new CANNON.Box(new CANNON.Vec3(leftWidth / 2, 0.25, module.config.depth / 2));
    const rightShape = new CANNON.Box(new CANNON.Vec3(rightWidth / 2, 0.25, module.config.depth / 2));
    
    const leftBody = new CANNON.Body({
      mass: 0,
      shape: leftShape,
      position: new CANNON.Vec3(leftMesh.position.x, leftMesh.position.y, leftMesh.position.z),
    });
    
    const rightBody = new CANNON.Body({
      mass: 0,
      shape: rightShape,
      position: new CANNON.Vec3(rightMesh.position.x, rightMesh.position.y, rightMesh.position.z),
    });
    
    this.physicsEngine.world.addBody(leftBody);
    this.physicsEngine.world.addBody(rightBody);
    
    this.levelObjects.push({ mesh: leftMesh, body: leftBody, module });
    this.levelObjects.push({ mesh: rightMesh, body: rightBody, module });
  }

  createTurn(module) {
    const { width, depth, color } = module.config;
    const startPos = module.startPosition || new THREE.Vector3();
    
    const geometry = new THREE.BoxGeometry(width, 0.5, depth);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.7,
      metalness: 0.1,
    });
    const mesh = new THREE.Mesh(geometry, material);
    
    const position = startPos.clone().add(
      module.direction.clone().multiplyScalar(depth / 2)
    );
    position.y += 0.25;
    
    mesh.position.copy(position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    
    const shape = new CANNON.Box(new CANNON.Vec3(width / 2, 0.25, depth / 2));
    const body = new CANNON.Body({
      mass: 0,
      shape: shape,
      position: new CANNON.Vec3(position.x, position.y, position.z),
    });
    
    this.physicsEngine.world.addBody(body);
    
    this.levelObjects.push({ mesh, body, module });
  }

  createAbyss(module) {
    const { width, gapWidth, color } = module.config;
    const startPos = module.startPosition || new THREE.Vector3();
    
    const geometry = new THREE.BoxGeometry(width, 0.5, module.config.depth);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.7,
      metalness: 0.1,
      transparent: true,
      opacity: 0.8,
    });
    
    const startMesh = new THREE.Mesh(geometry, material);
    const endMesh = new THREE.Mesh(geometry, material);
    
    startMesh.position.copy(startPos);
    startMesh.position.y += 0.25;
    
    const endPosition = startPos.clone().add(
      module.direction.clone().multiplyScalar(module.config.depth + gapWidth)
    );
    endMesh.position.copy(endPosition);
    endMesh.position.y += 0.25;
    
    startMesh.castShadow = true;
    startMesh.receiveShadow = true;
    endMesh.castShadow = true;
    endMesh.receiveShadow = true;
    
    this.scene.add(startMesh);
    this.scene.add(endMesh);
    
    const shape = new CANNON.Box(new CANNON.Vec3(width / 2, 0.25, module.config.depth / 2));
    
    const startBody = new CANNON.Body({
      mass: 0,
      shape: shape,
      position: new CANNON.Vec3(startMesh.position.x, startMesh.position.y, startMesh.position.z),
    });
    
    const endBody = new CANNON.Body({
      mass: 0,
      shape: shape,
      position: new CANNON.Vec3(endMesh.position.x, endMesh.position.y, endMesh.position.z),
    });
    
    this.physicsEngine.world.addBody(startBody);
    this.physicsEngine.world.addBody(endBody);
    
    this.levelObjects.push({ mesh: startMesh, body: startBody, module });
    this.levelObjects.push({ mesh: endMesh, body: endBody, module });
  }

  createDeliveryZone(module) {
    const { width, depth, height, color } = module.config;
    const startPos = module.startPosition || new THREE.Vector3();
    
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.5,
      metalness: 0.2,
      emissive: color,
      emissiveIntensity: 0.2,
    });
    const mesh = new THREE.Mesh(geometry, material);
    
    const position = startPos.clone().add(
      module.direction.clone().multiplyScalar(depth / 2)
    );
    position.y += height / 2;
    
    mesh.position.copy(position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    
    const shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
    const body = new CANNON.Body({
      mass: 0,
      shape: shape,
      position: new CANNON.Vec3(position.x, position.y, position.z),
    });
    this.physicsEngine.world.addBody(body);
    
    const markerGeometry = new THREE.CylinderGeometry(0.5, 0.5, 4, 16);
    const markerMaterial = new THREE.MeshStandardMaterial({
      color: 0xf1c40f,
      emissive: 0xf39c12,
      emissiveIntensity: 0.5,
    });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.copy(position);
    marker.position.y += 2 + height / 2;
    this.scene.add(marker);
    
    this.levelObjects.push({ mesh, body, module, marker });
  }

  clearLevel() {
    for (const obj of this.levelObjects) {
      this.scene.remove(obj.mesh);
      if (obj.marker) {
        this.scene.remove(obj.marker);
        obj.marker.geometry.dispose();
        obj.marker.material.dispose();
      }
      obj.mesh.geometry.dispose();
      obj.mesh.material.dispose();
      
      if (obj.body) {
        this.physicsEngine.world.removeBody(obj.body);
      }
    }
    
    this.levelObjects = [];
  }

  getDeliveryPosition() {
    const deliveryObj = this.levelObjects.find(obj => obj.module?.isDelivery);
    return deliveryObj ? deliveryObj.mesh.position.clone() : null;
  }

  checkDeliveryReached(position) {
    const deliveryPos = this.getDeliveryPosition();
    if (!deliveryPos) return false;
    
    const distance = position.distanceTo(deliveryPos);
    return distance < 3;
  }
}
