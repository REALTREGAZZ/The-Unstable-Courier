import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GAME_CONFIG } from './config.js';

export class Courier {
  constructor(physicsEngine, scene) {
    this.physicsEngine = physicsEngine;
    this.scene = scene;
    
    this.bodies = {
      head: null,
      body: null,
      leftArm: null,
      rightArm: null,
      hips: null,
      leftLeg: null,
      rightLeg: null,
      leftFoot: null,
      rightFoot: null,
    };
    
    this.meshes = {
      head: null,
      body: null,
      leftArm: null,
      rightArm: null,
      hips: null,
      leftLeg: null,
      rightLeg: null,
      leftFoot: null,
      rightFoot: null,
    };
    
    this.constraints = [];
    
    this.velocity = new THREE.Vector3();
    this.isGrounded = false;
    this.jumpCooldown = 0;
    
    this.movementForce = 150;
    this.sprintMultiplier = 1.5;
    this.jumpForce = 800;
  }
  
  createRagdoll(position = new THREE.Vector3(0, 5, 0)) {
    this.createHead(position);
    this.createBody(position);
    this.createArms(position);
    this.createHips(position);
    this.createLegs(position);
    this.createFeet(position);
    this.createConstraints();
  }
  
  createHead(position) {
    const headRadius = 0.2;
    const headShape = new CANNON.Sphere(headRadius);
    this.bodies.head = this.physicsEngine.createRigidBody(
      headShape,
      5,
      { x: position.x, y: position.y + 1.2, z: position.z }
    );
    this.bodies.head.linearDamping = 0.3;
    this.bodies.head.angularDamping = 0.3;
    
    const headGeometry = new THREE.SphereGeometry(headRadius, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffc896 });
    this.meshes.head = new THREE.Mesh(headGeometry, headMaterial);
    this.meshes.head.castShadow = true;
    this.scene.add(this.meshes.head);
  }
  
  createBody(position) {
    const bodyShape = new CANNON.Box(new CANNON.Vec3(0.3, 0.5, 0.2));
    this.bodies.body = this.physicsEngine.createRigidBody(
      bodyShape,
      50,
      { x: position.x, y: position.y, z: position.z }
    );
    this.bodies.body.linearDamping = 0.5;
    this.bodies.body.angularDamping = 0.5;
    this.bodies.body.material = new CANNON.Material({ friction: 0.95 });
    
    const bodyGeometry = new THREE.BoxGeometry(0.6, 1.0, 0.4);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x3498db });
    this.meshes.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.meshes.body.castShadow = true;
    this.scene.add(this.meshes.body);
  }
  
  createArms(position) {
    const armRadius = 0.075;
    const armLength = 0.8;
    const armShape = new CANNON.Cylinder(armRadius, armRadius, armLength, 8);
    
    this.bodies.leftArm = this.physicsEngine.createRigidBody(
      armShape,
      3,
      { x: position.x - 0.45, y: position.y + 0.2, z: position.z }
    );
    this.bodies.leftArm.linearDamping = 0.4;
    this.bodies.leftArm.angularDamping = 0.4;
    this.bodies.leftArm.material = new CANNON.Material({ friction: 0.3 });
    
    this.bodies.rightArm = this.physicsEngine.createRigidBody(
      armShape,
      3,
      { x: position.x + 0.45, y: position.y + 0.2, z: position.z }
    );
    this.bodies.rightArm.linearDamping = 0.4;
    this.bodies.rightArm.angularDamping = 0.4;
    this.bodies.rightArm.material = new CANNON.Material({ friction: 0.3 });
    
    const armGeometry = new THREE.CylinderGeometry(armRadius, armRadius, armLength, 8);
    const armMaterial = new THREE.MeshStandardMaterial({ color: 0x2c3e50 });
    
    this.meshes.leftArm = new THREE.Mesh(armGeometry, armMaterial);
    this.meshes.leftArm.castShadow = true;
    this.scene.add(this.meshes.leftArm);
    
    this.meshes.rightArm = new THREE.Mesh(armGeometry, armMaterial);
    this.meshes.rightArm.castShadow = true;
    this.scene.add(this.meshes.rightArm);
  }
  
  createHips(position) {
    const hipsShape = new CANNON.Box(new CANNON.Vec3(0.25, 0.15, 0.15));
    this.bodies.hips = this.physicsEngine.createRigidBody(
      hipsShape,
      15,
      { x: position.x, y: position.y - 0.8, z: position.z }
    );
    this.bodies.hips.linearDamping = 0.4;
    this.bodies.hips.angularDamping = 0.4;
    
    const hipsGeometry = new THREE.BoxGeometry(0.5, 0.3, 0.3);
    const hipsMaterial = new THREE.MeshStandardMaterial({ color: 0x2c3e50 });
    this.meshes.hips = new THREE.Mesh(hipsGeometry, hipsMaterial);
    this.meshes.hips.castShadow = true;
    this.scene.add(this.meshes.hips);
  }
  
  createLegs(position) {
    const legRadius = 0.075;
    const legLength = 0.9;
    const legShape = new CANNON.Cylinder(legRadius, legRadius, legLength, 8);
    
    this.bodies.leftLeg = this.physicsEngine.createRigidBody(
      legShape,
      4,
      { x: position.x - 0.15, y: position.y - 1.5, z: position.z }
    );
    this.bodies.leftLeg.linearDamping = 0.4;
    this.bodies.leftLeg.angularDamping = 0.4;
    
    this.bodies.rightLeg = this.physicsEngine.createRigidBody(
      legShape,
      4,
      { x: position.x + 0.15, y: position.y - 1.5, z: position.z }
    );
    this.bodies.rightLeg.linearDamping = 0.4;
    this.bodies.rightLeg.angularDamping = 0.4;
    
    const legGeometry = new THREE.CylinderGeometry(legRadius, legRadius, legLength, 8);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x95a5a6 });
    
    this.meshes.leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    this.meshes.leftLeg.castShadow = true;
    this.scene.add(this.meshes.leftLeg);
    
    this.meshes.rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    this.meshes.rightLeg.castShadow = true;
    this.scene.add(this.meshes.rightLeg);
  }
  
  createFeet(position) {
    const footRadius = 0.15;
    const footShape = new CANNON.Sphere(footRadius);
    
    this.bodies.leftFoot = this.physicsEngine.createRigidBody(
      footShape,
      1,
      { x: position.x - 0.15, y: position.y - 2.1, z: position.z }
    );
    this.bodies.leftFoot.linearDamping = 0.5;
    this.bodies.leftFoot.angularDamping = 0.5;
    this.bodies.leftFoot.material = new CANNON.Material({ friction: 0.5 });
    
    this.bodies.rightFoot = this.physicsEngine.createRigidBody(
      footShape,
      1,
      { x: position.x + 0.15, y: position.y - 2.1, z: position.z }
    );
    this.bodies.rightFoot.linearDamping = 0.5;
    this.bodies.rightFoot.angularDamping = 0.5;
    this.bodies.rightFoot.material = new CANNON.Material({ friction: 0.5 });
    
    const footGeometry = new THREE.SphereGeometry(footRadius, 12, 12);
    const footMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    
    this.meshes.leftFoot = new THREE.Mesh(footGeometry, footMaterial);
    this.meshes.leftFoot.castShadow = true;
    this.scene.add(this.meshes.leftFoot);
    
    this.meshes.rightFoot = new THREE.Mesh(footGeometry, footMaterial);
    this.meshes.rightFoot.castShadow = true;
    this.scene.add(this.meshes.rightFoot);
  }
  
  createConstraints() {
    const neckConstraint = new CANNON.PointToPointConstraint(
      this.bodies.head,
      new CANNON.Vec3(0, -0.2, 0),
      this.bodies.body,
      new CANNON.Vec3(0, 0.5, 0)
    );
    this.physicsEngine.world.addConstraint(neckConstraint);
    this.constraints.push(neckConstraint);
    
    const leftShoulderConstraint = new CANNON.PointToPointConstraint(
      this.bodies.body,
      new CANNON.Vec3(-0.3, 0.4, 0),
      this.bodies.leftArm,
      new CANNON.Vec3(0, 0.4, 0)
    );
    this.physicsEngine.world.addConstraint(leftShoulderConstraint);
    this.constraints.push(leftShoulderConstraint);
    
    const rightShoulderConstraint = new CANNON.PointToPointConstraint(
      this.bodies.body,
      new CANNON.Vec3(0.3, 0.4, 0),
      this.bodies.rightArm,
      new CANNON.Vec3(0, 0.4, 0)
    );
    this.physicsEngine.world.addConstraint(rightShoulderConstraint);
    this.constraints.push(rightShoulderConstraint);
    
    const waistConstraint = new CANNON.PointToPointConstraint(
      this.bodies.body,
      new CANNON.Vec3(0, -0.5, 0),
      this.bodies.hips,
      new CANNON.Vec3(0, 0.15, 0)
    );
    this.physicsEngine.world.addConstraint(waistConstraint);
    this.constraints.push(waistConstraint);
    
    const leftElbowConstraint = new CANNON.PointToPointConstraint(
      this.bodies.leftArm,
      new CANNON.Vec3(0, -0.4, 0),
      this.bodies.hips,
      new CANNON.Vec3(-0.25, 0, 0)
    );
    this.physicsEngine.world.addConstraint(leftElbowConstraint);
    this.constraints.push(leftElbowConstraint);
    
    const rightElbowConstraint = new CANNON.PointToPointConstraint(
      this.bodies.rightArm,
      new CANNON.Vec3(0, -0.4, 0),
      this.bodies.hips,
      new CANNON.Vec3(0.25, 0, 0)
    );
    this.physicsEngine.world.addConstraint(rightElbowConstraint);
    this.constraints.push(rightElbowConstraint);
    
    const leftKneeConstraint = new CANNON.PointToPointConstraint(
      this.bodies.hips,
      new CANNON.Vec3(-0.15, -0.15, 0),
      this.bodies.leftLeg,
      new CANNON.Vec3(0, 0.45, 0)
    );
    this.physicsEngine.world.addConstraint(leftKneeConstraint);
    this.constraints.push(leftKneeConstraint);
    
    const rightKneeConstraint = new CANNON.PointToPointConstraint(
      this.bodies.hips,
      new CANNON.Vec3(0.15, -0.15, 0),
      this.bodies.rightLeg,
      new CANNON.Vec3(0, 0.45, 0)
    );
    this.physicsEngine.world.addConstraint(rightKneeConstraint);
    this.constraints.push(rightKneeConstraint);
    
    const leftAnkleConstraint = new CANNON.PointToPointConstraint(
      this.bodies.leftLeg,
      new CANNON.Vec3(0, -0.45, 0),
      this.bodies.leftFoot,
      new CANNON.Vec3(0, 0, 0)
    );
    this.physicsEngine.world.addConstraint(leftAnkleConstraint);
    this.constraints.push(leftAnkleConstraint);
    
    const rightAnkleConstraint = new CANNON.PointToPointConstraint(
      this.bodies.rightLeg,
      new CANNON.Vec3(0, -0.45, 0),
      this.bodies.rightFoot,
      new CANNON.Vec3(0, 0, 0)
    );
    this.physicsEngine.world.addConstraint(rightAnkleConstraint);
    this.constraints.push(rightAnkleConstraint);
  }
  
  applyInput(inputManager, deltaTime, cameraDirection) {
    if (this.jumpCooldown > 0) {
      this.jumpCooldown -= deltaTime;
    }
    
    const isSprinting = inputManager.isKeyPressed('ShiftLeft') || inputManager.isKeyPressed('ShiftRight');
    const forceMultiplier = isSprinting ? this.movementForce * this.sprintMultiplier : this.movementForce;
    
    const forward = new CANNON.Vec3(cameraDirection.x, 0, cameraDirection.z);
    forward.normalize();
    
    const right = new CANNON.Vec3();
    right.x = -forward.z;
    right.z = forward.x;
    
    const moveForce = new CANNON.Vec3(0, 0, 0);
    
    if (inputManager.isKeyPressed('KeyW')) {
      moveForce.x += forward.x * forceMultiplier;
      moveForce.z += forward.z * forceMultiplier;
    }
    if (inputManager.isKeyPressed('KeyS')) {
      moveForce.x -= forward.x * forceMultiplier;
      moveForce.z -= forward.z * forceMultiplier;
    }
    if (inputManager.isKeyPressed('KeyA')) {
      moveForce.x -= right.x * forceMultiplier;
      moveForce.z -= right.z * forceMultiplier;
    }
    if (inputManager.isKeyPressed('KeyD')) {
      moveForce.x += right.x * forceMultiplier;
      moveForce.z += right.z * forceMultiplier;
    }
    
    this.bodies.body.applyForce(moveForce, this.bodies.body.position);
    
    this.checkGrounded();
    
    if (inputManager.isKeyPressed('Space') && this.isGrounded && this.jumpCooldown <= 0) {
      const jumpImpulse = new CANNON.Vec3(0, this.jumpForce, 0);
      this.bodies.body.applyImpulse(jumpImpulse, this.bodies.body.position);
      this.bodies.hips.applyImpulse(new CANNON.Vec3(0, this.jumpForce * 0.3, 0), this.bodies.hips.position);
      this.jumpCooldown = 0.5;
    }
    
    if (inputManager.isKeyPressed('ControlLeft') || inputManager.isKeyPressed('KeyC')) {
      const crouchForce = new CANNON.Vec3(0, -300, 0);
      this.bodies.body.applyForce(crouchForce, this.bodies.body.position);
      this.bodies.hips.applyForce(crouchForce, this.bodies.hips.position);
    }
  }
  
  checkGrounded() {
    const leftFootY = this.bodies.leftFoot.position.y;
    const rightFootY = this.bodies.rightFoot.position.y;
    const avgFootY = (leftFootY + rightFootY) / 2;
    
    const leftFootVelY = Math.abs(this.bodies.leftFoot.velocity.y);
    const rightFootVelY = Math.abs(this.bodies.rightFoot.velocity.y);
    
    this.isGrounded = (avgFootY < 0.3 && leftFootVelY < 2 && rightFootVelY < 2);
  }
  
  update(deltaTime) {
    Object.keys(this.bodies).forEach((key) => {
      const body = this.bodies[key];
      const mesh = this.meshes[key];
      
      if (body && mesh) {
        mesh.position.copy(body.position);
        mesh.quaternion.copy(body.quaternion);
      }
    });
    
    this.velocity.set(
      this.bodies.body.velocity.x,
      this.bodies.body.velocity.y,
      this.bodies.body.velocity.z
    );
  }
  
  getPosition() {
    return new THREE.Vector3(
      this.bodies.body.position.x,
      this.bodies.body.position.y,
      this.bodies.body.position.z
    );
  }
  
  getHeadPosition() {
    return new THREE.Vector3(
      this.bodies.head.position.x,
      this.bodies.head.position.y,
      this.bodies.head.position.z
    );
  }
  
  dispose() {
    this.constraints.forEach((constraint) => {
      this.physicsEngine.world.removeConstraint(constraint);
    });
    this.constraints = [];
    
    Object.keys(this.bodies).forEach((key) => {
      const body = this.bodies[key];
      if (body) {
        this.physicsEngine.removeBody(body);
      }
    });
    
    Object.keys(this.meshes).forEach((key) => {
      const mesh = this.meshes[key];
      if (mesh) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
      }
    });
  }
}
