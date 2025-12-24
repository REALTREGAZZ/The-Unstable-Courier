import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GAME_CONFIG } from './config.js';

class ExplosionParticle {
  constructor(scene, position, velocity, color, lifetime = 1.0) {
    this.scene = scene;
    this.position = position.clone();
    this.velocity = velocity.clone();
    this.lifetime = lifetime;
    this.elapsed = 0;

    const size = 0.05 + Math.random() * 0.1;
    const geometry = new THREE.SphereGeometry(size, 8, 8);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      transparent: true,
      emissive: color,
      emissiveIntensity: 0.5
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);
  }

  update(deltaTime) {
    this.elapsed += deltaTime;
    
    // Apply velocity
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;
    
    // Apply gravity
    this.velocity.y -= 9.81 * deltaTime;
    
    this.mesh.position.copy(this.position);

    // Fade out
    const progress = this.elapsed / this.lifetime;
    this.mesh.material.opacity = 1 - progress;
    this.mesh.scale.setScalar(1 - progress * 0.5);
  }

  isAlive() {
    return this.elapsed < this.lifetime;
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}

export class Parcel {
  constructor(physicsEngine, scene) {
    this.physicsEngine = physicsEngine;
    this.scene = scene;
    
    // Estado
    this.health = GAME_CONFIG.PACKAGE.HEALTH;
    this.maxHealth = GAME_CONFIG.PACKAGE.HEALTH;
    this.isDamaged = false;
    this.isExploded = false;
    
    // Physics
    this.body = null;
    this.mesh = null;
    
    // Attachment
    this.attachedToCourier = false;
    this.courierBody = null;
    this.offsetFromCourier = new THREE.Vector3(0, 0.5, 0.2);
    this.constraint = null;

    this.particles = [];
    this.onExplode = null;
  }
  
  createParcel(position) {
    const size = GAME_CONFIG.PACKAGE.SIZE;
    const halfExtents = new CANNON.Vec3(size.x, size.y, size.z);
    const shape = new CANNON.Box(halfExtents);
    
    this.body = this.physicsEngine.createRigidBody(
      shape,
      GAME_CONFIG.PACKAGE.MASS,
      { x: position.x, y: position.y, z: position.z }
    );
    
    this.body.material = new CANNON.Material({
      friction: GAME_CONFIG.PACKAGE.FRICTION,
      restitution: GAME_CONFIG.PACKAGE.RESTITUTION
    });
    
    const geometry = new THREE.BoxGeometry(size.x * 2, size.y * 2, size.z * 2);
    const material = new THREE.MeshStandardMaterial({
      color: 0xe74c3c,
      emissive: 0x330000,
      emissiveIntensity: 0.5
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);
  }
  
  takeDamage(amount) {
    if (this.isExploded || amount <= 0) return;
    
    this.health -= amount;
    this.isDamaged = true;
    
    // Visual feedback for damage
    this.createDamageParticles();
    
    // If damage is high enough, detach from courier
    if (amount > 15) {
      this.detach();
    }
    
    if (this.health <= 0) {
      this.health = 0;
      this.explode();
    }
  }
  
  createDamageParticles() {
    const numParticles = 3;
    for (let i = 0; i < numParticles; i++) {
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 2,
        (Math.random() - 0.5) * 2
      );
      const color = Math.random() > 0.5 ? 0x555555 : 0xffaa00;
      const particle = new ExplosionParticle(this.scene, this.mesh.position, velocity, color, 0.5);
      this.particles.push(particle);
    }
  }
  
  explode() {
    if (this.isExploded) return;
    this.isExploded = true;
    
    // 1. Crear partículas de explosión
    const numParticles = 40;
    for (let i = 0; i < numParticles; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 5 + Math.random() * 10;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        5 + Math.random() * 10,
        Math.sin(angle) * speed
      );
      
      const color = i % 2 === 0 ? 0xff4400 : 0xffaa00;
      const particle = new ExplosionParticle(this.scene, this.mesh.position, velocity, color, 1.5);
      this.particles.push(particle);
    }
    
    // 2. Aplicar impulso explosivo a nearby objects (including itself)
    const explosionForce = new CANNON.Vec3(0, 10, 0);
    this.body.applyImpulse(explosionForce, this.body.position);
    
    // 3. Screenshake de cámara (Handled via callback)
    if (this.onExplode) {
      this.onExplode();
    }
    
    // 4. Sonido de explosión (Handled via callback)
    
    // 5. Cambiar material a "destroyed"
    this.mesh.material.color.set(0x111111);
    this.mesh.material.emissive.set(0xff3300);
    this.mesh.material.emissiveIntensity = 1.0;
    
    // 6. Detach del Courier
    this.detach();
  }
  
  attachToCourier(courierBody, offset) {
    this.courierBody = courierBody;
    this.offsetFromCourier.copy(offset);
    this.attachedToCourier = true;
    
    // Create a constraint to keep it attached
    // We use a PointToPointConstraint for a bit more "wobble"
    const localOffset = new CANNON.Vec3(offset.x, offset.y, offset.z);
    this.constraint = new CANNON.PointToPointConstraint(
      this.body,
      new CANNON.Vec3(0, 0, 0),
      courierBody,
      localOffset
    );
    
    this.physicsEngine.world.addConstraint(this.constraint);
  }
  
  detach() {
    if (this.attachedToCourier && this.constraint) {
      this.physicsEngine.world.removeConstraint(this.constraint);
      this.constraint = null;
      this.attachedToCourier = false;
      this.courierBody = null;
    }
  }
  
  update(deltaTime) {
    // Sincronizar posición/rotación Three.js ↔ Cannon
    if (this.body && this.mesh) {
      this.mesh.position.copy(this.body.position);
      this.mesh.quaternion.copy(this.body.quaternion);
    }
    
    // Update color based on health if not exploded
    if (!this.isExploded) {
      const healthPercent = this.health / this.maxHealth;
      const color = new THREE.Color();
      if (healthPercent > 0.5) {
        // Green to Yellow
        color.setHSL(0.3 * (healthPercent - 0.5) * 2, 1, 0.5);
      } else {
        // Yellow to Red
        color.setHSL(0, 1, 0.5 * (healthPercent / 0.5));
      }
      this.mesh.material.color.copy(color);
    }
    
    // Check for extreme fall speed damage
    if (!this.isExploded && this.body) {
      const fallSpeed = Math.abs(this.body.velocity.y);
      if (fallSpeed > GAME_CONFIG.PACKAGE.FALL_DAMAGE_THRESHOLD) {
        const damage = (fallSpeed - GAME_CONFIG.PACKAGE.FALL_DAMAGE_THRESHOLD) * GAME_CONFIG.PACKAGE.FALL_DAMAGE_MULTIPLIER;
        this.takeDamage(damage);
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.update(deltaTime);
      if (!particle.isAlive()) {
        particle.dispose();
        this.particles.splice(i, 1);
      }
    }
  }
  
  getHealth() {
    return this.health;
  }
  
  getHealthPercent() {
    return (this.health / this.maxHealth) * 100;
  }
  
  dispose() {
    this.detach();
    if (this.body) {
      this.physicsEngine.removeBody(this.body);
    }
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
    }
    this.particles.forEach(p => p.dispose());
    this.particles = [];
  }
}
