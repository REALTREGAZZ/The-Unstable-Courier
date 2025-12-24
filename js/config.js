export const GAME_CONFIG = {
  FPS: 60,
  
  PLAYER: {
    MASS: 80,
    HEIGHT: 1.8,
    GRAVITY: 35,
    FRICTION: 0.95,
  },
  
  PACKAGE: {
    MASS: 5,
    SIZE: { x: 0.3, y: 0.3, z: 0.4 },
    HEALTH: 100,
    EXPLOSION_THRESHOLD: 50,
    FRICTION: 0.3,
    RESTITUTION: 0.4,
    DAMAGE_MULTIPLIER: 50,
    FALL_DAMAGE_THRESHOLD: 25,
    FALL_DAMAGE_MULTIPLIER: 2,
  },
  
  WORLD: {
    GRAVITY: -35,
  },
  
  PHYSICS: {
    TIMESTEP: 1 / 60,
    SUBSTEPS: 4,
  },
  
  INPUT: {
    KEYS: {
      W: 'KeyW',
      A: 'KeyA',
      S: 'KeyS',
      D: 'KeyD',
      SPACE: 'Space',
    },
    MOUSE_SENSITIVITY: 0.002,
  },
  
  RENDERER: {
    ANTIALIAS: true,
    POWER_PREFERENCE: 'high-performance',
  },
  
  CAMERA: {
    FOV: 60,
    NEAR: 0.1,
    FAR: 1000,
  },
  
  LEVEL: {
    START_LEVEL: 1,
    MAX_LEVEL: 20,
    MODULES_PER_LEVEL_BASE: 8,
    DIFFICULTY_SCALING: true,
  },
  
  SCORING: {
    BASE_POINTS: 2000,
    TIME_PAR: 60, // seconds
    STYLE_BONUS_PER_STUNT: 250,
    MAX_STUNTS_PER_LEVEL: 2,
  },
};
