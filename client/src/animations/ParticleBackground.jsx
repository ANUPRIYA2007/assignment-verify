import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ParticleBackground() {
    const mountRef = useRef(null);

    useEffect(() => {
        if (!mountRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        mountRef.current.appendChild(renderer.domElement);

        // ─── Galaxy Spiral Particles ───
        const galaxyCount = 1200;
        const galaxyPositions = new Float32Array(galaxyCount * 3);
        const galaxyColors = new Float32Array(galaxyCount * 3);
        const galaxySizes = new Float32Array(galaxyCount);

        const colorInner = new THREE.Color(0x6C63FF);
        const colorOuter = new THREE.Color(0xFF6584);
        const colorAccent = new THREE.Color(0x00D4AA);

        const arms = 3;
        const spin = 1.8;
        const randomness = 0.4;

        for (let i = 0; i < galaxyCount; i++) {
            const radius = Math.random() * 8 + 0.5;
            const armAngle = ((i % arms) / arms) * Math.PI * 2;
            const spinAngle = radius * spin;
            const angle = armAngle + spinAngle;

            const randomX = (Math.random() - 0.5) * randomness * radius;
            const randomY = (Math.random() - 0.5) * randomness * 0.5;
            const randomZ = (Math.random() - 0.5) * randomness * radius;

            galaxyPositions[i * 3] = Math.cos(angle) * radius + randomX;
            galaxyPositions[i * 3 + 1] = randomY;
            galaxyPositions[i * 3 + 2] = Math.sin(angle) * radius + randomZ;

            const mixRatio = radius / 8.5;
            const color = colorInner.clone().lerp(colorOuter, mixRatio);
            if (Math.random() > 0.85) color.lerp(colorAccent, 0.6);

            galaxyColors[i * 3] = color.r;
            galaxyColors[i * 3 + 1] = color.g;
            galaxyColors[i * 3 + 2] = color.b;

            galaxySizes[i] = Math.random() * 2.5 + 0.3;
        }

        const galaxyGeometry = new THREE.BufferGeometry();
        galaxyGeometry.setAttribute('position', new THREE.BufferAttribute(galaxyPositions, 3));
        galaxyGeometry.setAttribute('color', new THREE.BufferAttribute(galaxyColors, 3));

        const galaxyMaterial = new THREE.PointsMaterial({
            size: 0.06,
            vertexColors: true,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true,
            depthWrite: false
        });

        const galaxy = new THREE.Points(galaxyGeometry, galaxyMaterial);
        galaxy.rotation.x = Math.PI * 0.15;
        scene.add(galaxy);

        // ─── Nebula Dust Cloud ───
        const nebulaCount = 400;
        const nebulaPositions = new Float32Array(nebulaCount * 3);
        const nebulaColors = new Float32Array(nebulaCount * 3);

        for (let i = 0; i < nebulaCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 3 + Math.random() * 6;

            nebulaPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            nebulaPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.4;
            nebulaPositions[i * 3 + 2] = r * Math.cos(phi);

            const color = new THREE.Color().setHSL(0.7 + Math.random() * 0.15, 0.6, 0.4 + Math.random() * 0.2);
            nebulaColors[i * 3] = color.r;
            nebulaColors[i * 3 + 1] = color.g;
            nebulaColors[i * 3 + 2] = color.b;
        }

        const nebulaGeometry = new THREE.BufferGeometry();
        nebulaGeometry.setAttribute('position', new THREE.BufferAttribute(nebulaPositions, 3));
        nebulaGeometry.setAttribute('color', new THREE.BufferAttribute(nebulaColors, 3));

        const nebulaMaterial = new THREE.PointsMaterial({
            size: 0.15,
            vertexColors: true,
            transparent: true,
            opacity: 0.25,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true,
            depthWrite: false
        });

        const nebula = new THREE.Points(nebulaGeometry, nebulaMaterial);
        scene.add(nebula);

        // ─── Shooting Stars ───
        const shootingStarCount = 6;
        const shootingStars = [];

        for (let i = 0; i < shootingStarCount; i++) {
            const trailLength = 15;
            const trailPositions = new Float32Array(trailLength * 3);
            const trailOpacities = new Float32Array(trailLength);

            for (let j = 0; j < trailLength; j++) {
                trailPositions[j * 3] = 0;
                trailPositions[j * 3 + 1] = 0;
                trailPositions[j * 3 + 2] = 0;
                trailOpacities[j] = 1 - j / trailLength;
            }

            const trailGeom = new THREE.BufferGeometry();
            trailGeom.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));

            const trailMat = new THREE.LineBasicMaterial({
                color: 0xFFFFFF,
                transparent: true,
                opacity: 0,
                blending: THREE.AdditiveBlending
            });

            const trail = new THREE.Line(trailGeom, trailMat);
            scene.add(trail);

            shootingStars.push({
                trail,
                geometry: trailGeom,
                material: trailMat,
                active: false,
                timer: Math.random() * 8 + i * 3,
                speed: 0.3 + Math.random() * 0.2,
                position: new THREE.Vector3(),
                direction: new THREE.Vector3(),
                life: 0,
                maxLife: 60
            });
        }

        // ─── Floating Geometric Shapes ───
        const torusGeom = new THREE.TorusKnotGeometry(1.0, 0.3, 100, 16);
        const torusMat = new THREE.MeshBasicMaterial({
            color: 0x6C63FF,
            wireframe: true,
            transparent: true,
            opacity: 0.06
        });
        const torus = new THREE.Mesh(torusGeom, torusMat);
        torus.position.set(5, 2, -6);
        scene.add(torus);

        const icosaGeom = new THREE.IcosahedronGeometry(0.8, 1);
        const icosaMat = new THREE.MeshBasicMaterial({
            color: 0xFF6584,
            wireframe: true,
            transparent: true,
            opacity: 0.05
        });
        const icosa = new THREE.Mesh(icosaGeom, icosaMat);
        icosa.position.set(-5, -2, -5);
        scene.add(icosa);

        const octaGeom = new THREE.OctahedronGeometry(0.6, 0);
        const octaMat = new THREE.MeshBasicMaterial({
            color: 0x00D4AA,
            wireframe: true,
            transparent: true,
            opacity: 0.05
        });
        const octa = new THREE.Mesh(octaGeom, octaMat);
        octa.position.set(3, -3, -4);
        scene.add(octa);

        camera.position.z = 7;

        // ─── Mouse Parallax ───
        let mouseX = 0, mouseY = 0;
        let targetMouseX = 0, targetMouseY = 0;

        const onMouseMove = (e) => {
            targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
            targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
        };
        window.addEventListener('mousemove', onMouseMove);

        // ─── Animation Loop ───
        const clock = new THREE.Clock();
        let animationId;

        const animate = () => {
            animationId = requestAnimationFrame(animate);
            const elapsed = clock.getElapsedTime();
            const delta = clock.getDelta();

            // Smooth mouse interpolation (inertia)
            mouseX += (targetMouseX - mouseX) * 0.03;
            mouseY += (targetMouseY - mouseY) * 0.03;

            // Galaxy rotation
            galaxy.rotation.y = elapsed * 0.04;
            galaxy.rotation.z = Math.sin(elapsed * 0.02) * 0.05;

            // Pulsate galaxy particles
            const gPos = galaxyGeometry.attributes.position.array;
            for (let i = 0; i < galaxyCount; i++) {
                const ix = i * 3 + 1;
                gPos[ix] += Math.sin(elapsed * 0.5 + i * 0.1) * 0.0008;
            }
            galaxyGeometry.attributes.position.needsUpdate = true;

            // Nebula slow drift
            nebula.rotation.y = elapsed * 0.015;
            nebula.rotation.x = Math.sin(elapsed * 0.01) * 0.1;
            nebulaMaterial.opacity = 0.2 + Math.sin(elapsed * 0.3) * 0.08;

            // Shooting stars
            shootingStars.forEach((star) => {
                if (!star.active) {
                    star.timer -= 0.016;
                    if (star.timer <= 0) {
                        star.active = true;
                        star.life = 0;
                        star.position.set(
                            (Math.random() - 0.5) * 12,
                            (Math.random()) * 4 + 2,
                            (Math.random() - 0.5) * 6 - 3
                        );
                        star.direction.set(
                            -0.5 - Math.random() * 0.5,
                            -0.3 - Math.random() * 0.3,
                            -0.1
                        ).normalize();
                        star.material.opacity = 0.8;
                    }
                } else {
                    star.life++;
                    const pos = star.geometry.attributes.position.array;

                    // Shift trail positions backward
                    for (let j = (pos.length / 3 - 1); j > 0; j--) {
                        pos[j * 3] = pos[(j - 1) * 3];
                        pos[j * 3 + 1] = pos[(j - 1) * 3 + 1];
                        pos[j * 3 + 2] = pos[(j - 1) * 3 + 2];
                    }

                    // Move head
                    star.position.add(star.direction.clone().multiplyScalar(star.speed));
                    pos[0] = star.position.x;
                    pos[1] = star.position.y;
                    pos[2] = star.position.z;

                    star.geometry.attributes.position.needsUpdate = true;

                    // Fade out
                    star.material.opacity = Math.max(0, 0.8 * (1 - star.life / star.maxLife));

                    if (star.life >= star.maxLife) {
                        star.active = false;
                        star.timer = 4 + Math.random() * 8;
                        star.material.opacity = 0;
                    }
                }
            });

            // Rotate geometric shapes
            torus.rotation.x = elapsed * 0.15;
            torus.rotation.y = elapsed * 0.1;
            torus.position.y = 2 + Math.sin(elapsed * 0.4) * 0.5;

            icosa.rotation.x = -elapsed * 0.12;
            icosa.rotation.z = elapsed * 0.18;
            icosa.position.y = -2 + Math.cos(elapsed * 0.35) * 0.4;

            octa.rotation.y = elapsed * 0.2;
            octa.rotation.z = elapsed * 0.15;
            octa.position.y = -3 + Math.sin(elapsed * 0.5) * 0.3;

            // Camera follows mouse with smooth inertia
            camera.position.x += (mouseX * 0.8 - camera.position.x) * 0.015;
            camera.position.y += (mouseY * 0.5 - camera.position.y) * 0.015;
            camera.lookAt(0, 0, 0);

            renderer.render(scene, camera);
        };
        animate();

        // ─── Resize Handler ───
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('resize', handleResize);
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            galaxyGeometry.dispose();
            galaxyMaterial.dispose();
            nebulaGeometry.dispose();
            nebulaMaterial.dispose();
            torusGeom.dispose();
            torusMat.dispose();
            icosaGeom.dispose();
            icosaMat.dispose();
            octaGeom.dispose();
            octaMat.dispose();
            shootingStars.forEach(s => {
                s.geometry.dispose();
                s.material.dispose();
            });
            renderer.dispose();
        };
    }, []);

    return <div ref={mountRef} className="three-canvas" />;
}
