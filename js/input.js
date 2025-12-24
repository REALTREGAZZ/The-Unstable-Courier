export class InputManager {
  constructor() {
    this.keys = {};
    this.mouse = {
      x: 0,
      y: 0,
      deltaX: 0,
      deltaY: 0,
      locked: false,
      wheelDelta: 0,
    };
    
    this.setupKeyboardListeners();
    this.setupMouseListeners();
  }
  
  setupKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });
    
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }
  
  setupMouseListeners() {
    document.addEventListener('click', () => {
      if (!this.mouse.locked) {
        document.body.requestPointerLock();
      }
    });
    
    document.addEventListener('pointerlockchange', () => {
      this.mouse.locked = document.pointerLockElement === document.body;
    });
    
    document.addEventListener('mousemove', (e) => {
      if (this.mouse.locked) {
        this.mouse.deltaX = e.movementX || 0;
        this.mouse.deltaY = e.movementY || 0;
      }
    });
    
    window.addEventListener('wheel', (e) => {
      this.mouse.wheelDelta = e.deltaY;
    });
  }
  
  isKeyPressed(keyCode) {
    return this.keys[keyCode] || false;
  }
  
  getMouseDelta() {
    const delta = {
      x: this.mouse.deltaX,
      y: this.mouse.deltaY,
    };
    this.mouse.deltaX = 0;
    this.mouse.deltaY = 0;
    return delta;
  }
  
  getWheelDelta() {
    const delta = this.mouse.wheelDelta;
    this.mouse.wheelDelta = 0;
    return delta;
  }
  
  reset() {
    this.mouse.deltaX = 0;
    this.mouse.deltaY = 0;
    this.mouse.wheelDelta = 0;
  }
}
