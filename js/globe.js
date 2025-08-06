// 3D Globe visualization functionality
class GlobeManager {
    constructor() {
        // Safer initialization with fallbacks
        this.state = (typeof STATE !== 'undefined' && STATE.globe) ? STATE.globe : {
            currentState: 0,
            isTransitioning: false,
            mouseInteraction: false,
            targetPosition: { x: 0, y: 0, z: 0 },
            targetRotation: { x: 0, y: 0, z: 0 },
            currentPosition: { x: 0, y: 0, z: 0 },
            currentRotation: { x: 0, y: 0, z: 0 },
            animationFrame: null,
            mouse: { x: 0, y: 0 }
        };
        
        this.config = (typeof CONFIG !== 'undefined' && CONFIG.globe) ? CONFIG.globe : {
            radius: 450,
            states: {
                global: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0.1, y: 0, z: 0 }, cameraZ: 1600, opacity: 0.45 },
                america: { position: { x: 60, y: 30, z: 0 }, rotation: { x: 0.15, y: -0.5, z: 0 }, cameraZ: 1100, opacity: 0.55 },
                texas: { position: { x: 90, y: 45, z: 0 }, rotation: { x: 0.25, y: -0.7, z: 0 }, cameraZ: 800, opacity: 0.65 }
            },
            financialCenters: [],
            tradeRoutes: [],
            dataFlows: []
        };
        
        // Three.js objects
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.globeGroup = null;
        this.globe = null;
        this.financialCenters = null;
        this.wireframeLines = null;
        this.tradeRoutes = null;
        this.dataFlows = null;
        
        // Enhanced animation properties
        this.cameraAnimation = {
            isAnimating: false,
            startPosition: { x: 0, y: 0, z: 800 },
            targetPosition: { x: 0, y: 0, z: 800 },
            startTime: 0,
            duration: 3000
        };
        
        // Refined rotation properties
        this.autoRotation = {
            speed: 0.05,
            enabled: true,
            damping: 0.98
        };
    }

    // Initialize the 3D globe with optimized dimensions and rendering
    initGlobe() {
        // Scene setup
        this.scene = new THREE.Scene();
        
        // Optimized camera configuration - reduced FOV for less distortion and better proportions
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 3000);
        
        const canvas = document.getElementById('globeCanvas');
        const container = document.querySelector('.globe-container');
        
        if (!canvas) {
            console.error('❌ Globe canvas element not found!');
            return;
        }
        
        if (!container) {
            console.error('❌ Globe container element not found!');
            return;
        }
        
        console.log('✅ Found canvas and container elements');
        
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            alpha: true, 
            antialias: true,
            powerPreference: "high-performance"
        });
        
        // Enhanced renderer sizing with proper pixel ratio handling
        const containerRect = container.getBoundingClientRect();
        const pixelRatio = Math.min(window.devicePixelRatio, 2);
        
        this.renderer.setSize(containerRect.width, containerRect.height);
        this.renderer.setPixelRatio(pixelRatio);
        this.renderer.setClearColor(0x000000, 0);
        
        // Store container dimensions for resize calculations
        this.containerDimensions = {
            width: containerRect.width,
            height: containerRect.height,
            aspect: containerRect.width / containerRect.height
        };
        
        // Update camera aspect ratio based on container
        this.camera.aspect = this.containerDimensions.aspect;
        this.camera.updateProjectionMatrix();
        
        // Create globe group for easier manipulation
        this.globeGroup = new THREE.Group();
        this.scene.add(this.globeGroup);
        
        // Create multiple wireframe layers for depth
        this.createWireframeGlobe();
        
        // Add financial center markers
        this.createFinancialCenters();
        
        // Set initial camera position adjusted for new radius
        this.camera.position.set(0, 0, 1200);
        this.camera.lookAt(0, 0, 0);
        
        // Add mouse interaction
        this.addMouseInteraction(canvas);
        
        // Set initial cursor style to indicate interactivity
        canvas.style.cursor = 'grab';
        canvas.style.userSelect = 'none';
        canvas.style.outline = 'none';
        
        // Start animation loop
        this.animateGlobe();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onGlobeResize());
    }

    createWireframeGlobe() {
        // Main wireframe sphere with enhanced opacity for better visibility during zoom
        const mainGeometry = new THREE.SphereGeometry(this.config.radius, 128, 64);
        const mainMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true,
            transparent: true,
            opacity: 0.12 // Increased from 0.08 for better visibility
        });
        this.globe = new THREE.Mesh(mainGeometry, mainMaterial);
        this.globeGroup.add(this.globe);

        // Create continent outlines for Earth recognition
        this.createContinentOutlines();

        // Enhanced latitude lines with better visibility
        const latitudes = [-66.5, -45, -23.5, 0, 23.5, 45, 66.5];
        latitudes.forEach((lat, index) => {
            const latRadius = this.config.radius * Math.cos(lat * Math.PI / 180);
            const points = [];
            for (let i = 0; i <= 256; i++) {
                const angle = (i / 256) * Math.PI * 2;
                const x = latRadius * Math.cos(angle);
                const z = latRadius * Math.sin(angle);
                const y = this.config.radius * Math.sin(lat * Math.PI / 180);
                points.push(new THREE.Vector3(x, y, z));
            }
            
            const latGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const opacity = lat === 0 ? 0.35 : 0.18; // Increased opacity for better visibility
            const latMaterial = new THREE.LineBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: opacity
            });
            const latLine = new THREE.Line(latGeometry, latMaterial);
            this.globeGroup.add(latLine);
        });

        // Enhanced longitude lines with improved visibility
        for (let lon = 0; lon < 360; lon += 15) {
            const points = [];
            for (let lat = -90; lat <= 90; lat += 0.75) {
                const phi = (90 - lat) * (Math.PI / 180);
                const theta = lon * (Math.PI / 180);
                const x = this.config.radius * Math.sin(phi) * Math.cos(theta);
                const y = this.config.radius * Math.cos(phi);
                const z = this.config.radius * Math.sin(phi) * Math.sin(theta);
                points.push(new THREE.Vector3(x, y, z));
            }
            const lonGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const isPrimeMeridian = lon === 0 || lon === 180;
            const opacity = isPrimeMeridian ? 0.3 : 0.12; // Increased for better visibility
            const lonMaterial = new THREE.LineBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: opacity
            });
            const lonLine = new THREE.Line(lonGeometry, lonMaterial);
            this.globeGroup.add(lonLine);
        }

        // Enhanced depth sphere with better visibility
        const depthGeometry = new THREE.SphereGeometry(this.config.radius * 0.99, 64, 32);
        const depthMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.035, // Increased from 0.02 for subtle depth enhancement
            side: THREE.BackSide
        });
        const depthSphere = new THREE.Mesh(depthGeometry, depthMaterial);
        this.globeGroup.add(depthSphere);

        // Enhanced outer atmospheric glow
        const glowGeometry = new THREE.SphereGeometry(this.config.radius * 1.02, 64, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.025, // Increased for better atmospheric effect
            side: THREE.BackSide
        });
        const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
        this.globeGroup.add(glowSphere);
    }

    createContinentOutlines() {
        const continentGroup = new THREE.Group();
        
        // Simplified continent coordinates (lat, lon pairs)
        const continents = {
            northAmerica: [
                [60, -150], [55, -160], [50, -170], [45, -175], [40, -180],
                [35, -180], [32, -175], [30, -170], [25, -165], [20, -160],
                [20, -155], [15, -150], [10, -145], [15, -140], [20, -135],
                [25, -130], [30, -125], [35, -120], [40, -115], [45, -110],
                [50, -105], [55, -100], [60, -95], [65, -90], [70, -85],
                [75, -80], [70, -75], [65, -70], [60, -65], [55, -60],
                [50, -65], [45, -70], [40, -75], [35, -80], [30, -85],
                [25, -90], [30, -95], [35, -100], [40, -105], [45, -110],
                [50, -115], [55, -120], [60, -125], [65, -130], [60, -135],
                [55, -140], [60, -145], [60, -150]
            ],
            southAmerica: [
                [10, -80], [5, -85], [0, -90], [-5, -85], [-10, -80],
                [-15, -75], [-20, -70], [-25, -65], [-30, -60], [-35, -55],
                [-40, -60], [-45, -65], [-50, -70], [-55, -65], [-50, -60],
                [-45, -55], [-40, -50], [-35, -45], [-30, -40], [-25, -35],
                [-20, -40], [-15, -45], [-10, -50], [-5, -55], [0, -60],
                [5, -65], [10, -70], [15, -75], [10, -80]
            ],
            africa: [
                [35, 10], [30, 5], [25, 0], [20, 5], [15, 10], [10, 15],
                [5, 20], [0, 25], [-5, 30], [-10, 35], [-15, 40], [-20, 45],
                [-25, 40], [-30, 35], [-35, 30], [-30, 25], [-25, 20],
                [-20, 15], [-15, 10], [-10, 5], [-5, 0], [0, -5], [5, 0],
                [10, 5], [15, 10], [20, 15], [25, 20], [30, 25], [35, 30],
                [35, 25], [35, 20], [35, 15], [35, 10]
            ],
            europe: [
                [70, 20], [65, 15], [60, 10], [55, 5], [50, 0], [45, 5],
                [50, 10], [55, 15], [60, 20], [65, 25], [70, 30], [70, 25], [70, 20]
            ],
            asia: [
                [70, 60], [65, 55], [60, 50], [55, 45], [50, 40], [45, 35],
                [40, 30], [35, 35], [30, 40], [25, 45], [30, 50], [35, 55],
                [40, 60], [45, 65], [50, 70], [55, 75], [60, 80], [65, 85],
                [70, 90], [75, 95], [70, 100], [65, 105], [60, 110], [55, 115],
                [50, 120], [45, 125], [40, 130], [35, 135], [30, 140], [25, 145],
                [30, 150], [35, 155], [40, 160], [45, 165], [50, 170], [55, 175],
                [60, 180], [65, 175], [70, 170], [75, 165], [70, 160], [65, 155],
                [70, 150], [75, 145], [70, 140], [65, 135], [70, 130], [75, 125],
                [70, 120], [65, 115], [70, 110], [75, 105], [70, 100], [65, 95],
                [70, 90], [75, 85], [70, 80], [65, 75], [70, 70], [70, 65], [70, 60]
            ],
            australia: [
                [-10, 115], [-15, 120], [-20, 125], [-25, 130], [-30, 135],
                [-35, 140], [-40, 145], [-35, 150], [-30, 155], [-25, 150],
                [-20, 145], [-15, 140], [-10, 135], [-5, 130], [-10, 125],
                [-15, 120], [-10, 115]
            ]
        };

        // Create continent outlines
        Object.keys(continents).forEach(continentName => {
            const coords = continents[continentName];
            const points = [];
            
            coords.forEach(([lat, lon]) => {
                const phi = (90 - lat) * (Math.PI / 180);
                const theta = (lon + 180) * (Math.PI / 180);
                
                const x = this.config.radius * 1.001 * Math.sin(phi) * Math.cos(theta);
                const y = this.config.radius * 1.001 * Math.cos(phi);
                const z = this.config.radius * 1.001 * Math.sin(phi) * Math.sin(theta);
                
                points.push(new THREE.Vector3(x, y, z));
            });
            
            if (points.length > 0) {
                points.push(points[0]);
            }
            
            const continentGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const continentMaterial = new THREE.LineBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.3,
                linewidth: 1
            });
            
            const continentLine = new THREE.Line(continentGeometry, continentMaterial);
            continentGroup.add(continentLine);
        });

        this.addMajorIslands(continentGroup);
        this.globeGroup.add(continentGroup);
    }

    addMajorIslands(continentGroup) {
        const islands = [
            { lat: 36, lon: 138, size: 8 }, // Japan
            { lat: 54, lon: -2, size: 6 }, // UK
            { lat: -20, lon: 47, size: 5 }, // Madagascar
            { lat: -41, lon: 174, size: 4 }, // New Zealand
            { lat: 65, lon: -18, size: 3 }, // Iceland
            { lat: 72, lon: -40, size: 10 } // Greenland
        ];

        islands.forEach(island => {
            const points = [];
            const segments = Math.max(8, island.size);
            
            for (let i = 0; i <= segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                const offsetLat = island.lat + Math.cos(angle) * island.size * 0.5;
                const offsetLon = island.lon + Math.sin(angle) * island.size * 0.5;
                
                const phi = (90 - offsetLat) * (Math.PI / 180);
                const theta = (offsetLon + 180) * (Math.PI / 180);
                
                const x = this.config.radius * 1.001 * Math.sin(phi) * Math.cos(theta);
                const y = this.config.radius * 1.001 * Math.cos(phi);
                const z = this.config.radius * 1.001 * Math.sin(phi) * Math.sin(theta);
                
                points.push(new THREE.Vector3(x, y, z));
            }
            
            const islandGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const islandMaterial = new THREE.LineBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.25
            });
            
            const islandLine = new THREE.Line(islandGeometry, islandMaterial);
            continentGroup.add(islandLine);
        });
    }

    createFinancialCenters() {
        this.financialCenters = new THREE.Group();
        
        // Create trade routes first (so they appear behind markers)
        this.createTradeRoutes();
        
        // Create data flow cables
        this.createDataFlowCables();
        
        // Calculate proportional marker size based on globe radius
        const baseMarkerSize = this.config.radius * 0.008;
        
        this.config.financialCenters.forEach((center, index) => {
            const phi = (90 - center.lat) * (Math.PI / 180);
            const theta = (center.lon + 180) * (Math.PI / 180);
            
            const x = this.config.radius * 1.01 * Math.sin(phi) * Math.cos(theta);
            const y = this.config.radius * 1.01 * Math.cos(phi);
            const z = this.config.radius * 1.01 * Math.sin(phi) * Math.sin(theta);
            
            // Enhanced marker size based on importance and market cap
            const markerSize = baseMarkerSize * (0.5 + center.importance * 0.8);
            
            // Create tiered marker system based on financial center type
            const markerGroup = this.createFinancialMarker(center, markerSize, x, y, z, index);
            
            this.financialCenters.add(markerGroup);
        });
        
        this.globeGroup.add(this.financialCenters);
    }

    // Create sophisticated financial center markers with multiple layers
    createFinancialMarker(center, size, x, y, z, index) {
        const markerGroup = new THREE.Group();
        
        // Main marker sphere with type-based styling
        const markerGeometry = new THREE.SphereGeometry(size, 16, 12);
        let markerColor, markerOpacity;
        
        switch (center.type) {
            case 'primary':
                markerColor = 0xffffff;
                markerOpacity = 0.9;
                break;
            case 'secondary':
                markerColor = 0xcccccc;
                markerOpacity = 0.8;
                break;
            case 'emerging':
                markerColor = 0x999999;
                markerOpacity = 0.7;
                break;
        }
        
        const markerMaterial = new THREE.MeshBasicMaterial({
            color: markerColor,
            transparent: true,
            opacity: markerOpacity
        });
        
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.set(x, y, z);
        
        // Enhanced data tracking
        marker.userData = {
            originalOpacity: markerOpacity,
            pulseOffset: index * 0.3,
            baseSize: size,
            center: center,
            importance: center.importance,
            marketCap: center.marketCap,
            type: center.type
        };
        
        markerGroup.add(marker);
        
        // Add importance ring for primary centers
        if (center.type === 'primary') {
            const ringGeometry = new THREE.RingGeometry(size * 1.5, size * 1.8, 32);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.set(x, y, z);
            ring.lookAt(0, 0, 0); // Face camera
            
            ring.userData = {
                pulseOffset: index * 0.4,
                baseOpacity: 0.3
            };
            
            markerGroup.add(ring);
        }
        
        // Add market cap indicator (small satellite sphere)
        if (center.marketCap > 5.0) { // Only for major markets
            const satGeometry = new THREE.SphereGeometry(size * 0.4, 8, 6);
            const satMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.6
            });
            const satellite = new THREE.Mesh(satGeometry, satMaterial);
            
            // Position satellite in orbit around main marker
            const orbitRadius = size * 2.5;
            const orbitAngle = (index * 60) * (Math.PI / 180); // Distribute satellites
            satellite.position.set(
                x + orbitRadius * Math.cos(orbitAngle),
                y + orbitRadius * Math.sin(orbitAngle),
                z
            );
            
            satellite.userData = {
                orbitCenter: { x, y, z },
                orbitRadius: orbitRadius,
                orbitSpeed: 0.02 + center.importance * 0.01,
                baseOpacity: 0.6
            };
            
            markerGroup.add(satellite);
        }
        
        markerGroup.userData = marker.userData;
        return markerGroup;
    }

    // Create trade routes as animated connections between financial centers
    createTradeRoutes() {
        this.tradeRoutes = new THREE.Group();
        
        // Create lookup for financial centers
        const centerLookup = {};
        this.config.financialCenters.forEach(center => {
            centerLookup[center.name] = center;
        });
        
        this.config.tradeRoutes.forEach((route, index) => {
            const fromCenter = centerLookup[route.from];
            const toCenter = centerLookup[route.to];
            
            if (!fromCenter || !toCenter) return;
            
            // Convert to 3D coordinates
            const fromPos = this.latLonToVector3(fromCenter.lat, fromCenter.lon);
            const toPos = this.latLonToVector3(toCenter.lat, toCenter.lon);
            
            // Create curved route line
            const curve = this.createRouteCurve(fromPos, toPos, route.strength);
            const routeLine = this.createRouteVisualization(curve, route, index);
            
            this.tradeRoutes.add(routeLine);
        });
        
        this.globeGroup.add(this.tradeRoutes);
    }

    // Create curved route between two points
    createRouteCurve(fromPos, toPos, strength) {
        const distance = fromPos.distanceTo(toPos);
        const curveHeight = Math.min(distance * 0.3, this.config.radius * 0.4);
        
        // Create control point above the globe surface
        const midPoint = new THREE.Vector3()
            .addVectors(fromPos, toPos)
            .multiplyScalar(0.5)
            .normalize()
            .multiplyScalar(this.config.radius + curveHeight * strength);
        
        // Create quadratic bezier curve
        const curve = new THREE.QuadraticBezierCurve3(fromPos, midPoint, toPos);
        return curve;
    }

    // Create route visualization with animated flow
    createRouteVisualization(curve, route, index) {
        const routeGroup = new THREE.Group();
        
        // Main route line
        const points = curve.getPoints(64);
        const routeGeometry = new THREE.BufferGeometry().setFromPoints(points);
        
        let lineColor, lineOpacity;
        switch (route.type) {
            case 'primary':
                lineColor = 0xffffff;
                lineOpacity = 0.4 * route.strength;
                break;
            case 'secondary':
                lineColor = 0xcccccc;
                lineOpacity = 0.3 * route.strength;
                break;
            case 'emerging':
                lineColor = 0x999999;
                lineOpacity = 0.25 * route.strength;
                break;
        }
        
        const routeMaterial = new THREE.LineBasicMaterial({
            color: lineColor,
            transparent: true,
            opacity: lineOpacity
        });
        
        const routeLine = new THREE.Line(routeGeometry, routeMaterial);
        routeLine.userData = {
            curve: curve,
            strength: route.strength,
            type: route.type,
            baseOpacity: lineOpacity,
            pulseOffset: index * 0.2
        };
        
        routeGroup.add(routeLine);
        
        // Add animated flow particles for primary routes
        if (route.type === 'primary' && route.strength > 0.8) {
            const flowParticles = this.createFlowParticles(curve, route, index);
            routeGroup.add(flowParticles);
        }
        
        return routeGroup;
    }

    // Create animated flow particles along trade routes
    createFlowParticles(curve, route, index) {
        const particleGroup = new THREE.Group();
        const particleCount = Math.ceil(route.strength * 5); // More particles for stronger routes
        
        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.SphereGeometry(1.5, 6, 4);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.6
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.userData = {
                curve: curve,
                progress: i / particleCount, // Start at different positions
                speed: 0.003 + route.strength * 0.002,
                baseOpacity: 0.6,
                pulseOffset: index * 0.1 + i * 0.05
            };
            
            particleGroup.add(particle);
        }
        
        return particleGroup;
    }

    // Create data flow cables (submarine cables, satellite links)
    createDataFlowCables() {
        this.dataFlows = new THREE.Group();
        
        this.config.dataFlows.forEach((flow, index) => {
            const cablePoints = [];
            
            flow.points.forEach(([lat, lon]) => {
                const pos = this.latLonToVector3(lat, lon);
                cablePoints.push(pos);
            });
            
            // Create cable path
            let cable;
            if (cablePoints.length === 2) {
                // Direct connection
                const curve = this.createCableCurve(cablePoints[0], cablePoints[1], flow.type);
                cable = this.createCableVisualization(curve, flow, index);
            } else {
                // Multi-point path
                cable = this.createMultiPointCable(cablePoints, flow, index);
            }
            
            this.dataFlows.add(cable);
        });
        
        this.globeGroup.add(this.dataFlows);
    }

    // Create cable curve (underwater or satellite)
    createCableCurve(fromPos, toPos, type) {
        const distance = fromPos.distanceTo(toPos);
        let curveHeight;
        
        if (type === 'cable') {
            // Submarine cables follow ocean floor - minimal height
            curveHeight = this.config.radius * 0.02;
        } else {
            // Satellite links - higher arc
            curveHeight = this.config.radius * 0.6;
        }
        
        const midPoint = new THREE.Vector3()
            .addVectors(fromPos, toPos)
            .multiplyScalar(0.5)
            .normalize()
            .multiplyScalar(this.config.radius + curveHeight);
        
        return new THREE.QuadraticBezierCurve3(fromPos, midPoint, toPos);
   }

    // Convert lat/lon to 3D vector
    latLonToVector3(lat, lon) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        
        const x = this.config.radius * 1.005 * Math.sin(phi) * Math.cos(theta);
        const y = this.config.radius * 1.005 * Math.cos(phi);
        const z = this.config.radius * 1.005 * Math.sin(phi) * Math.sin(theta);
        
        return new THREE.Vector3(x, y, z);
    }

    // Create cable visualization
    createCableVisualization(curve, flow, index) {
        const points = curve.getPoints(128);
        const cableGeometry = new THREE.BufferGeometry().setFromPoints(points);
        
        const cableMaterial = new THREE.LineBasicMaterial({
            color: flow.type === 'cable' ? 0x4444ff : 0x44ff44,
            transparent: true,
            opacity: 0.15,
            linewidth: 2
        });
        
        const cable = new THREE.Line(cableGeometry, cableMaterial);
        cable.userData = {
            flow: flow,
            baseOpacity: 0.15,
            pulseOffset: index * 0.25
        };
        
        return cable;
   }

    // New method for delicate wireframe opacity animation
    animateWireframeOpacity(state) {
        const targetOpacities = {
            0: { main: 0.08, continents: 0.3, markers: 0.8 },  // global
            1: { main: 0.12, continents: 0.4, markers: 0.9 },  // america
            2: { main: 0.15, continents: 0.5, markers: 1.0 }   // texas
        };
        
        const target = targetOpacities[state];
        
        // Animate main wireframe
        if (this.globe && this.globe.material) {
            const startOpacity = this.globe.material.opacity;
            const duration = 2000;
            const startTime = Date.now();
            
            const animateOpacity = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easeProgress = UTILS.easeOutQuart(progress);
                
                this.globe.material.opacity = UTILS.lerp(startOpacity, target.main, easeProgress);
                
                if (progress < 1) {
                    requestAnimationFrame(animateOpacity);
                }
            };
            
            animateOpacity();
        }
    }

    // Enhanced mouse interaction with NO cursor changes and complete snap-back fix
    addMouseInteraction(canvas) {
        let isDragging = false;
        let isRightClick = false;
        let previousMousePosition = { x: 0, y: 0 };
        let velocity = { x: 0, y: 0 };
        let momentum = { x: 0, y: 0 };
        let panVelocity = { x: 0, y: 0 };
        let panMomentum = { x: 0, y: 0 };

        // Enhanced mouse down handling - NO cursor changes + PREVENT ANIMATION TRIGGERS
        canvas.addEventListener('mousedown', (event) => {
            event.preventDefault();
            isDragging = true;
            isRightClick = event.button === 2;
            this.state.mouseInteraction = true;
            this.autoRotation.enabled = false;
            velocity = { x: 0, y: 0 };
            momentum = { x: 0, y: 0 };
            panVelocity = { x: 0, y: 0 };
            panMomentum = { x: 0, y: 0 };
            
            // CRITICAL FIX: Disable automated experience when user interacts with globe
            if (window.TextSliderManager && window.TextSliderManager.autoExperience) {
                window.TextSliderManager.autoExperience.isActive = false;
                console.log('🌍 Globe interaction detected - disabling automated experience');
            }
            
            previousMousePosition = {
                x: event.clientX,
                y: event.clientY
            };
            
            // NO cursor changes - user specifically requested this
        });

        // Enhanced mouse move with ultra-smooth controls
        canvas.addEventListener('mousemove', (event) => {
            const rect = canvas.getBoundingClientRect();
            this.state.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            this.state.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            if (isDragging && !this.state.isTransitioning) {
                const deltaMove = {
                    x: event.clientX - previousMousePosition.x,
                    y: event.clientY - previousMousePosition.y
                };

                if (isRightClick || event.shiftKey) {
                    // Panning mode - CRITICAL FIX: Completely prevent snap back
                    panVelocity.x = deltaMove.x * 1.2;
                    panVelocity.y = -deltaMove.y * 1.2;
                    
                    // CRITICAL: Update both target and current position immediately
                    this.state.targetPosition.x += panVelocity.x;
                    this.state.targetPosition.y += panVelocity.y;
                    this.state.currentPosition.x = this.state.targetPosition.x;
                    this.state.currentPosition.y = this.state.targetPosition.y;
                    
                    // Apply the position to the globe group immediately
                    this.globeGroup.position.set(
                        this.state.currentPosition.x,
                        this.state.currentPosition.y,
                        this.state.currentPosition.z
                    );
                    
                    // Smooth panning limits
                    const maxPan = 400;
                    this.state.targetPosition.x = Math.max(-maxPan, Math.min(maxPan, this.state.targetPosition.x));
                    this.state.targetPosition.y = Math.max(-maxPan, Math.min(maxPan, this.state.targetPosition.y));
                    this.state.currentPosition.x = this.state.targetPosition.x;
                    this.state.currentPosition.y = this.state.targetPosition.y;
                    
                    // CRITICAL: Mark user modification and store permanently
                    this.state.userModifiedPosition = true;
                    this.userPositionOffset = {
                        x: this.state.currentPosition.x,
                        y: this.state.currentPosition.y
                    };
                } else {
                    // Rotation mode - ultra-smooth rotation
                    velocity.x = deltaMove.x * 0.015;
                    velocity.y = deltaMove.y * 0.015;

                    const sensitivity = 0.8;
                    const deltaRotationQuaternion = new THREE.Quaternion()
                        .setFromEuler(new THREE.Euler(
                            UTILS.toRadians(deltaMove.y * sensitivity),
                            UTILS.toRadians(deltaMove.x * sensitivity),
                            0,
                            'XYZ'
                        ));

                    this.globeGroup.quaternion.multiplyQuaternions(deltaRotationQuaternion, this.globeGroup.quaternion);
                    
                    // CRITICAL: Store rotation permanently
                    this.state.userModifiedRotation = true;
                    this.userRotationQuaternion = this.globeGroup.quaternion.clone();
                }
            }

            previousMousePosition = {
                x: event.clientX,
                y: event.clientY
            };
        });

        // Mouse up handling - NO cursor changes
        canvas.addEventListener('mouseup', () => {
            isDragging = false;
            momentum = { ...velocity };
            panMomentum = { ...panVelocity };
            
            // CRITICAL: Store final user modifications permanently
            if (this.state.userModifiedPosition) {
                this.userPositionOffset = {
                    x: this.state.currentPosition.x,
                    y: this.state.currentPosition.y
                };
                console.log('💾 Stored user position permanently:', this.userPositionOffset);
            }
            
            if (this.state.userModifiedRotation) {
                this.userRotationQuaternion = this.globeGroup.quaternion.clone();
                console.log('💾 Stored user rotation permanently');
            }
            
            setTimeout(() => {
                this.state.mouseInteraction = false;
                this.autoRotation.enabled = true;
            }, 1500);
        });

        // Enhanced mouse leave handling - NO cursor changes
        canvas.addEventListener('mouseleave', () => {
            isDragging = false;
            momentum = { ...velocity };
            panMomentum = { ...panVelocity };
            
            // CRITICAL: Store final user modifications permanently
            if (this.state.userModifiedPosition) {
                this.userPositionOffset = {
                    x: this.state.currentPosition.x,
                    y: this.state.currentPosition.y
                };
            }
            
            if (this.state.userModifiedRotation) {
                this.userRotationQuaternion = this.globeGroup.quaternion.clone();
            }
            
            setTimeout(() => {
                this.state.mouseInteraction = false;
                this.autoRotation.enabled = true;
            }, 1500);
        });

        // Prevent context menu
        canvas.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });

        // Ultra-smooth wheel zooming
        canvas.addEventListener('wheel', (event) => {
            event.preventDefault();
            
            if (!this.state.isTransitioning) {
                const zoomSpeed = 40; // Increased for more responsive zooming
                const zoomDelta = event.deltaY > 0 ? zoomSpeed : -zoomSpeed;
                
                // Smooth zoom with expanded limits
                const currentZ = this.camera.position.z;
                const newZ = Math.max(300, Math.min(3000, currentZ + zoomDelta));
                
                // Immediate zoom for sleeker response
                this.camera.position.z = newZ;
            }
        });

        // Enhanced momentum system that respects user modifications
        const applyMomentum = () => {
            if (!isDragging && !this.state.isTransitioning) {
                // Rotational momentum with user rotation preservation
                if (Math.abs(momentum.x) > 0.001 || Math.abs(momentum.y) > 0.001) {
                    const momentumQuaternion = new THREE.Quaternion()
                        .setFromEuler(new THREE.Euler(
                            UTILS.toRadians(momentum.y * 0.8),
                            UTILS.toRadians(momentum.x * 0.8),
                            0,
                            'XYZ'
                        ));

                    this.globeGroup.quaternion.multiplyQuaternions(momentumQuaternion, this.globeGroup.quaternion);
                    
                    // CRITICAL: Store updated rotation to prevent snap back
                    if (this.state.userModifiedRotation) {
                        this.userRotationQuaternion = this.globeGroup.quaternion.clone();
                    }
                    
                    momentum.x *= 0.985;
                    momentum.y *= 0.985;
                }

                // CRITICAL: NO panning momentum that could override user position
                if (Math.abs(panMomentum.x) > 0.1 || Math.abs(panMomentum.y) > 0.1) {
                    // Only apply if user hasn't modified position or if actively interacting
                    if (!this.state.userModifiedPosition || this.state.mouseInteraction) {
                        // Very limited momentum that doesn't override user positioning
                        panMomentum.x *= 0.98;
                        panMomentum.y *= 0.98;
                    } else {
                        // Stop momentum completely if user has set a position
                        panMomentum.x = 0;
                        panMomentum.y = 0;
                    }
                }
            }
            
            requestAnimationFrame(applyMomentum);
        };
        
        applyMomentum();
    }

    // Refined animation loop with sophisticated camera transitions
    animateGlobe() {
        this.state.animationFrame = requestAnimationFrame(() => this.animateGlobe());

        if (!this.globeGroup) return;

        const time = Date.now() * 0.001;

        // Enhanced camera animation
        if (this.cameraAnimation.isAnimating) {
            const elapsed = Date.now() - this.cameraAnimation.startTime;
            const progress = Math.min(elapsed / this.cameraAnimation.duration, 1);
            
            // Use sophisticated easing curve for camera movement
            const easeProgress = this.cubicBezierEase(progress, 0.25, 0.1, 0.25, 1);
            
            this.camera.position.x = UTILS.lerp(
                this.cameraAnimation.startPosition.x,
                this.cameraAnimation.targetPosition.x,
                easeProgress
            );
            this.camera.position.y = UTILS.lerp(
                this.cameraAnimation.startPosition.y,
                this.cameraAnimation.targetPosition.y,
                easeProgress
            );
            this.camera.position.z = UTILS.lerp(
                this.cameraAnimation.startPosition.z,
                this.cameraAnimation.targetPosition.z,
                easeProgress
            );
        }

        // Smooth interpolation to target position and rotation with refined easing
        if (!this.state.mouseInteraction && !this.state.isTransitioning) {
            const lerpFactor = 0.012; // Slightly slower for larger globe - more deliberate movement
            
            this.state.currentPosition.x = UTILS.lerp(this.state.currentPosition.x, this.state.targetPosition.x, lerpFactor);
            this.state.currentPosition.y = UTILS.lerp(this.state.currentPosition.y, this.state.targetPosition.y, lerpFactor);
            this.state.currentPosition.z = UTILS.lerp(this.state.currentPosition.z, this.state.targetPosition.z, lerpFactor);
            
            this.state.currentRotation.x = UTILS.lerp(this.state.currentRotation.x, this.state.targetRotation.x, lerpFactor);
            this.state.currentRotation.y = UTILS.lerp(this.state.currentRotation.y, this.state.targetRotation.y, lerpFactor);
            this.state.currentRotation.z = UTILS.lerp(this.state.currentRotation.z, this.state.targetRotation.z, lerpFactor);
            
            this.globeGroup.position.set(this.state.currentPosition.x, this.state.currentPosition.y, this.state.currentPosition.z);
            
            // Enhanced auto-rotation with breathing effect - slower for larger globe
            const breathingRotation = Math.sin(time * 0.4) * 0.015; // Reduced amplitude and frequency
            const autoRotationSpeed = this.autoRotation.enabled ? this.autoRotation.speed * 0.8 : 0; // Slower rotation
            
            this.globeGroup.rotation.set(
                this.state.currentRotation.x + breathingRotation,
                this.state.currentRotation.y + time * autoRotationSpeed,
                this.state.currentRotation.z
            );
        }

        // Enhanced financial center markers with sophisticated pulsing - scaled for larger globe
        if (this.financialCenters) {
            this.financialCenters.children.forEach((markerGroup, index) => {
                const marker = markerGroup.children[0];
                if (marker && marker.userData) {
                    const pulseTime = time + marker.userData.pulseOffset;
                    
                    // More sophisticated pulsing with multiple sine waves
                    const primaryPulse = Math.sin(pulseTime * 1.5) * 0.5 + 0.5;
                    const secondaryPulse = Math.sin(pulseTime * 3) * 0.2 + 0.8;
                    const pulse = 0.4 + 0.6 * primaryPulse * secondaryPulse;
                    
                    marker.material.opacity = marker.userData.originalOpacity * pulse;
                    
                    // Delicate scale animation - proportional to marker base size
                    const scaleVariation = 1 + 0.12 * Math.sin(pulseTime * 2); // Reduced for larger markers
                    marker.scale.setScalar(scaleVariation);
                    
                    // Subtle color shifting for visual interest
                    const colorShift = 0.95 + 0.05 * Math.sin(pulseTime * 0.8);
                    marker.material.color.setScalar(colorShift);
                }
            });
        }

        // Animate trade routes
        if (this.tradeRoutes) {
            this.tradeRoutes.children.forEach(routeGroup => {
                routeGroup.children.forEach(child => {
                    if (child.userData.curve) {
                        // Route line pulsing
                        const routeTime = time + child.userData.pulseOffset;
                        const routePulse = Math.sin(routeTime * 1.5) * 0.3 + 0.7;
                        const strengthMultiplier = child.userData.strength;
                        
                        child.material.opacity = child.userData.baseOpacity * routePulse * strengthMultiplier;
                    }
                    
                    // Animate flow particles
                    if (child.userData.progress !== undefined) {
                        const particle = child;
                        particle.userData.progress += particle.userData.speed;
                        
                        if (particle.userData.progress > 1) {
                            particle.userData.progress = 0;
                        }
                        
                        // Update particle position along curve
                        const position = particle.userData.curve.getPoint(particle.userData.progress);
                        particle.position.copy(position);
                        
                        // Particle opacity based on position and speed
                        const flowTime = time + particle.userData.pulseOffset;
                        const flowPulse = Math.sin(flowTime * 3) * 0.4 + 0.6;
                        particle.material.opacity = particle.userData.baseOpacity * flowPulse;
                    }
                });
            });
        }

        // Animate data flow cables
        if (this.dataFlows) {
            this.dataFlows.children.forEach(cable => {
                if (cable.userData.flow) {
                    const cableTime = time + cable.userData.pulseOffset;
                    const cablePulse = Math.sin(cableTime * 0.5) * 0.5 + 0.5;
                    cable.material.opacity = cable.userData.baseOpacity * cablePulse;
                }
            });
        }

        this.renderer.render(this.scene, this.camera);
    }

    // Custom cubic bezier easing function for sophisticated animations
    cubicBezierEase(t, x1, y1, x2, y2) {
        // Simplified cubic bezier approximation
        const cx = 3 * x1;
        const bx = 3 * (x2 - x1) - cx;
        const ax = 1 - cx - bx;
        
        const cy = 3 * y1;
        const by = 3 * (y2 - y1) - cy;
        const ay = 1 - cy - by;
        
        const result = ay * Math.pow(t, 3) + by * Math.pow(t, 2) + cy * t;
        
        return Math.max(0, Math.min(1, result));
    }

    // Proper resize handler implementation for responsive globe rendering
    onGlobeResize() {
        const container = document.querySelector('.globe-container');
        if (!container || !this.renderer || !this.camera) return;
        
        const containerRect = container.getBoundingClientRect();
        const newWidth = containerRect.width;
        const newHeight = containerRect.height;
        
        // Update stored dimensions
        this.containerDimensions = {
            width: newWidth,
            height: newHeight,
            aspect: newWidth / newHeight
        };
        
        // Update camera aspect ratio and projection matrix
        this.camera.aspect = this.containerDimensions.aspect;
        this.camera.updateProjectionMatrix();
        
        // Update renderer size with proper pixel ratio
        const pixelRatio = Math.min(window.devicePixelRatio, 2);
        this.renderer.setSize(newWidth, newHeight);
        this.renderer.setPixelRatio(pixelRatio);
        
        console.log(`Globe resized to: ${newWidth}x${newHeight}, aspect: ${this.containerDimensions.aspect.toFixed(2)}`);
    }

    // Enhanced initialization with UTILS fallbacks
    init() {
        // Add UTILS fallbacks if not available
        if (typeof UTILS === 'undefined') {
            console.warn('⚠️ UTILS not found, creating fallbacks');
            window.UTILS = {
                toRadians: (angle) => angle * (Math.PI / 180),
                lerp: (start, end, factor) => start + (end - start) * factor,
                easeOutQuart: (t) => 1 - Math.pow(1 - t, 4),
                formatPrice: (price, decimals = 2) => price.toLocaleString('en-US', {
                    minimumFractionDigits: decimals,
                    maximumFractionDigits: decimals
                })
            };
        }
        
        if (typeof THREE !== 'undefined') {
            console.log('🌍 Initializing globe with THREE.js...');
            this.initGlobe();
            
            // Initialize at the global state position without auto-animation
            // Set camera to the global state distance immediately (no auto-zoom)
            this.camera.position.z = this.config.states.global.cameraZ; // 1600 for global view
            this.camera.position.x = 0;
            this.camera.position.y = 0;
            
            // Ensure camera animation is not active on init
            this.cameraAnimation.isAnimating = false;
            
            console.log('✅ Globe initialized successfully at global state distance');
        } else {
            console.error('❌ THREE.js not loaded - globe cannot initialize');
        }
    }

    // Cleanup on page unload
    destroy() {
        if (this.state.animationFrame) {
            cancelAnimationFrame(this.state.animationFrame);
        }
        
        // Performance optimization: pause animation when not visible
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (this.state.animationFrame) {
                    cancelAnimationFrame(this.state.animationFrame);
                }
            } else {
                if (this.globeGroup) {
                    this.animateGlobe();
                }
            }
        });
    }

    updateGlobeState(state) {
        if (this.state.isTransitioning) return;
        
        console.log(`🌍 Globe state transition: ${this.state.currentState} → ${state}`);
        this.state.isTransitioning = true;
        this.state.currentState = state;
        
        const states = ['global', 'america', 'texas'];
        const targetState = this.config.states[states[state]];
        
        // Enhanced smooth transition with proper bidirectional handling
        this.state.targetPosition = { ...targetState.position };
        this.state.targetRotation = { ...targetState.rotation };
        
        // Sophisticated camera animation with bidirectional awareness
        this.cameraAnimation.startPosition = {
            x: this.camera.position.x,
            y: this.camera.position.y,
            z: this.camera.position.z
        };
        this.cameraAnimation.targetPosition = {
            x: 0,
            y: 0,
            z: targetState.cameraZ
        };
        this.cameraAnimation.startTime = Date.now();
        
        // Dynamic duration based on zoom level change for smoother transitions
        const zoomChange = Math.abs(this.camera.position.z - targetState.cameraZ);
        this.cameraAnimation.duration = Math.min(4500, Math.max(2500, zoomChange * 4)); // Adaptive duration
        this.cameraAnimation.isAnimating = true;
        
        // Enhanced opacity transition with smooth curve
        const globeContainer = document.querySelector('.globe-container');
        if (globeContainer) {
            globeContainer.style.transition = 'opacity 3s cubic-bezier(0.25, 0.1, 0.25, 1)';
            globeContainer.style.opacity = targetState.opacity;
        }
        
        // Enhanced wireframe opacity during transition
        this.animateWireframeOpacity(state);
        
        // Completion callback with proper state reset
        setTimeout(() => {
            this.state.isTransitioning = false;
            this.cameraAnimation.isAnimating = false;
            console.log(`🌍 Globe transition to ${states[state]} complete (z: ${targetState.cameraZ})`);
        }, this.cameraAnimation.duration);
    }

    // Create multi-point cable for complex routes
    createMultiPointCable(cablePoints, flow, index) {
        const cableGroup = new THREE.Group();
        
        // Create segments between consecutive points
        for (let i = 0; i < cablePoints.length - 1; i++) {
            const fromPos = cablePoints[i];
            const toPos = cablePoints[i + 1];
            
            const curve = this.createCableCurve(fromPos, toPos, flow.type);
            const segment = this.createCableVisualization(curve, flow, index + i);
            
            cableGroup.add(segment);
        }
        
        return cableGroup;
    }
}

// Create global instance
window.GlobeManager = new GlobeManager();