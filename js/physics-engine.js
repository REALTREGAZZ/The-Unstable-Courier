import * as CANNON from 'cannon-es';
import { GAME_CONFIG } from './config.js';

export class PhysicsEngine {
  constructor() {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, GAME_CONFIG.WORLD.GRAVITY, 0),
    });
    
    this.world.broadphase = new CANNON.NaiveBroadphase();
    this.world.solver.iterations = 10;
    this.world.defaultContactMaterial.friction = 0.4;
    this.world.defaultContactMaterial.restitution = 0.3;
    
    this.bodies = [];
  }

  createRigidBody(shape, mass, position = { x: 0, y: 0, z: 0 }, quaternion = { x: 0, y: 0, z: 0, w: 1 }) {
    const body = new CANNON.Body({
      mass: mass,
      shape: shape,
      position: new CANNON.Vec3(position.x, position.y, position.z),
      quaternion: new CANNON.Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w),
    });
    
    this.world.addBody(body);
    this.bodies.push(body);
    
    return body;
  }

  removeBody(body) {
    const index = this.bodies.indexOf(body);
    if (index > -1) {
      this.bodies.splice(index, 1);
    }
    this.world.removeBody(body);
  }

  step(deltaTime) {
    this.world.step(
      GAME_CONFIG.PHYSICS.TIMESTEP,
      deltaTime,
      GAME_CONFIG.PHYSICS.SUBSTEPS
    );
  }

  dispose() {
    this.bodies.forEach(body => {
      this.world.removeBody(body);
    });
    this.bodies = [];
  }
}
