# The Unstable Courier

A physics-based rage game where you play as a ragdoll delivery person trying to deliver fragile packages through a world with absurd physics.

## Tech Stack

- **Three.js** - 3D graphics rendering
- **Cannon.js (cannon-es)** - Physics engine
- **Vite** - Development server and build tool

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open your browser and navigate to the URL shown in the terminal (typically `http://localhost:5173`).

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
The-Unstable-Courier/
├── index.html
├── package.json
├── css/
│   └── main.css
├── js/
│   ├── main.js           # Bootstrap + game loop
│   ├── config.js         # Global configuration
│   ├── world.js          # Three.js scene/camera/renderer
│   └── physics-engine.js # Cannon.js wrapper/integration
└── assets/
    ├── sounds/
    ├── textures/
    └── models/
```

## Development Status

Currently in initial scaffolding phase. The foundation is set up with:
- ✅ Three.js scene with lighting and camera
- ✅ Cannon.js physics engine integration
- ✅ Game loop running at 60 FPS
- ✅ Responsive canvas
- ✅ Modular ES6 architecture

Next steps will include implementing the player ragdoll, package mechanics, and procedural obstacle generation.
