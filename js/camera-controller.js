import * as THREE from 'three';
import { GAME_CONFIG } from './config.js';

export class CameraController {
  constructor(camera, target) {
    this.camera = camera;
    this.target = target;
    
    this.distance = 8;
    this.minDistance = 3;
    this.maxDistance = 20;
    this.height = 3;
    
    this.angle = 0;
    this.pitch = 0.3;
    this.minPitch = -Math.PI / 3;
    this.maxPitch = Math.PI / 2.5;
    
    this.sensitivity = GAME_CONFIG.INPUT.MOUSE_SENSITIVITY;
    
    this.currentPosition = new THREE.Vector3();
    this.currentLookAt = new THREE.Vector3();
    
    this.smoothing = 0.1;

    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeTime = 0;
    this.shakeOffset = new THREE.Vector3();
  }
  
  shake(intensity = 0.5, duration = 0.5) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTime = duration;
  }
  
  handleMouseInput(mouseDelta) {
    this.angle -= mouseDelta.x * this.sensitivity;
    this.pitch -= mouseDelta.y * this.sensitivity;
    
    this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
  }
  
  handleWheelInput(wheelDelta) {
    this.distance += wheelDelta * 0.01;
    this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));
  }
  
  update(deltaTime = 1/60) {
    const targetPosition = this.target.getPosition();
    
    const offsetX = Math.sin(this.angle) * Math.cos(this.pitch) * this.distance;
    const offsetY = Math.sin(this.pitch) * this.distance + this.height;
    const offsetZ = Math.cos(this.angle) * Math.cos(this.pitch) * this.distance;
    
    const desiredPosition = new THREE.Vector3(
      targetPosition.x + offsetX,
      targetPosition.y + offsetY,
      targetPosition.z + offsetZ
    );
    
    this.currentPosition.lerp(desiredPosition, this.smoothing);
    
    const lookAtTarget = new THREE.Vector3(
      targetPosition.x,
      targetPosition.y + 1,
      targetPosition.z
    );
    this.currentLookAt.lerp(lookAtTarget, this.smoothing);
    
    // Apply screenshake
    if (this.shakeTime > 0) {
      const currentIntensity = (this.shakeTime / this.shakeDuration) * this.shakeIntensity;
      this.shakeOffset.set(
        (Math.random() - 0.5) * currentIntensity,
        (Math.random() - 0.5) * currentIntensity,
        (Math.random() - 0.5) * currentIntensity
      );
      this.shakeTime -= deltaTime;
    } else {
      this.shakeOffset.set(0, 0, 0);
    }
    
    this.camera.position.copy(this.currentPosition).add(this.shakeOffset);
    this.camera.lookAt(this.currentLookAt);
  }
  
  getCameraDirection() {
    const direction = new THREE.Vector3();
    direction.x = -Math.sin(this.angle);
    direction.z = -Math.cos(this.angle);
    direction.normalize();
    return direction;
  }
}
