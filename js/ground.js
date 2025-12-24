import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export function createGround(physicsEngine, scene) {
  const groundSize = 100;
  const groundShape = new CANNON.Plane();
  const groundBody = new CANNON.Body({
    mass: 0,
    shape: groundShape,
  });
  groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  physicsEngine.world.addBody(groundBody);
  
  const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x7cba5a,
    roughness: 0.8,
    metalness: 0.2,
  });
  const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);
  
  const gridHelper = new THREE.GridHelper(groundSize, 50, 0x444444, 0x888888);
  scene.add(gridHelper);
  
  return {
    body: groundBody,
    mesh: groundMesh,
  };
}
