import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild } from '@angular/core';
import * as THREE from 'three';

@Component({
  selector: 'app-hero',
  standalone: true,
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
})
export class HeroComponent implements AfterViewInit, OnDestroy {
  @ViewChild('threeStage', { static: true }) threeStage!: ElementRef<HTMLDivElement>;

  private renderer?: THREE.WebGLRenderer;
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private sculpture?: THREE.Group;
  private frame?: number;
  private resizeObserver?: ResizeObserver;
  private pointerX = 0;
  private pointerY = 0;
  private reducedMotion = false;

  constructor(private zone: NgZone) {}

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => this.createScene());
  }

  private createScene(): void {
    const stage = this.threeStage.nativeElement;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    this.camera.position.set(0, 0, 11);

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    stage.appendChild(this.renderer.domElement);

    this.sculpture = new THREE.Group();
    this.sculpture.rotation.set(-0.34, 0.22, -0.12);
    this.scene.add(this.sculpture);

    const ribbonGeometry = this.createRibbonGeometry();
    const ribbon = new THREE.Mesh(ribbonGeometry, new THREE.MeshPhysicalMaterial({
      color: 0xc88490,
      roughness: 0.32,
      metalness: 0.05,
      clearcoat: 0.8,
      clearcoatRoughness: 0.24,
      side: THREE.DoubleSide,
    }));
    this.sculpture.add(ribbon);

    const wire = new THREE.Mesh(ribbonGeometry, new THREE.MeshBasicMaterial({
      color: 0x5d505c,
      wireframe: true,
      transparent: true,
      opacity: 0.085,
    }));
    wire.scale.setScalar(1.006);
    this.sculpture.add(wire);

    const pearlGeometry = new THREE.SphereGeometry(0.105, 20, 20);
    const pearlMaterial = new THREE.MeshStandardMaterial({ color: 0xeee7df, roughness: 0.25 });
    for (let index = 0; index < 7; index += 1) {
      const angle = (index / 7) * Math.PI * 2;
      const pearl = new THREE.Mesh(pearlGeometry, pearlMaterial);
      pearl.position.set(Math.cos(angle) * 3.25, Math.sin(angle * 2) * 0.72, Math.sin(angle) * 1.75);
      pearl.userData['orbit'] = angle;
      this.sculpture.add(pearl);
    }

    this.scene.add(new THREE.HemisphereLight(0xfff5ec, 0x514653, 2.6));
    const key = new THREE.DirectionalLight(0xffd7d9, 4.4);
    key.position.set(-3, 5, 7);
    this.scene.add(key);
    const lavenderLight = new THREE.PointLight(0xb9a9bd, 14, 18);
    lavenderLight.position.set(4, -2, 4);
    this.scene.add(lavenderLight);

    window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(stage);
    this.resize();

    // Keep scroll-linked art direction active for everyone. Reduced-motion
    // mode removes autonomous floating/rotation, but still reflects the
    // visitor's deliberate scroll position.
    this.animate();
  }

  private createRibbonGeometry(): THREE.BufferGeometry {
    const lengthSegments = 240;
    const widthSegments = 16;
    const positions: number[] = [];
    const wavePositions: number[] = [];
    const flowPositions: number[] = [];
    const indices: number[] = [];

    for (let segment = 0; segment <= lengthSegments; segment += 1) {
      const t = (segment / lengthSegments) * Math.PI * 2;
      const radius = 2.55 + Math.sin(t * 3) * 0.22;
      const center = new THREE.Vector3(
        Math.cos(t) * radius,
        Math.sin(t * 2) * 0.72,
        Math.sin(t) * 1.72,
      );
      const radial = new THREE.Vector3(Math.cos(t), 0, Math.sin(t)).normalize();
      const lift = new THREE.Vector3(0, 1, 0);
      const twist = t * 1.5;
      const widthDirection = radial.multiplyScalar(Math.cos(twist)).add(lift.multiplyScalar(Math.sin(twist))).normalize();

      const waveCenter = new THREE.Vector3(
        (segment / lengthSegments - 0.5) * 6.2,
        Math.sin(t * 2) * 0.75,
        Math.cos(t) * 0.38,
      );
      const waveWidth = new THREE.Vector3(0, Math.cos(t * 1.5), Math.sin(t * 1.5)).normalize();

      // A loose silk-like current rather than a tightly wound helix. Keeping
      // this path open gives the final scroll state a calmer, more organic
      // silhouette while the changing width vector adds a gentle fold.
      const progress = segment / lengthSegments;
      const flowCenter = new THREE.Vector3(
        (progress - 0.5) * 6.4,
        Math.sin((progress - 0.5) * Math.PI * 1.65) * 1.25
          + Math.sin(progress * Math.PI * 3.2) * 0.18,
        Math.cos(progress * Math.PI * 1.35) * 0.62,
      );
      const flowFold = progress * Math.PI * 1.4 - Math.PI * 0.2;
      const flowWidth = new THREE.Vector3(
        0.12 * Math.sin(progress * Math.PI),
        Math.cos(flowFold),
        Math.sin(flowFold),
      ).normalize();

      for (let across = 0; across <= widthSegments; across += 1) {
        const offset = (across / widthSegments - 0.5) * 1.15;
        const point = center.clone().addScaledVector(widthDirection, offset);
        const wavePoint = waveCenter.clone().addScaledVector(waveWidth, offset * 0.82);
        const flowPoint = flowCenter.clone().addScaledVector(flowWidth, offset * 0.9);
        positions.push(point.x, point.y, point.z);
        wavePositions.push(wavePoint.x, wavePoint.y, wavePoint.z);
        flowPositions.push(flowPoint.x, flowPoint.y, flowPoint.z);
      }
    }

    const row = widthSegments + 1;
    for (let segment = 0; segment < lengthSegments; segment += 1) {
      for (let across = 0; across < widthSegments; across += 1) {
        const a = segment * row + across;
        const b = a + row;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.morphAttributes['position'] = [
      new THREE.Float32BufferAttribute(wavePositions, 3),
      new THREE.Float32BufferAttribute(flowPositions, 3),
    ];
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  private readonly onPointerMove = (event: PointerEvent): void => {
    this.pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
    this.pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
  };

  private resize(): void {
    if (!this.renderer || !this.camera) return;
    const { clientWidth, clientHeight } = this.threeStage.nativeElement;
    this.renderer.setSize(clientWidth, clientHeight, false);
    this.camera.aspect = clientWidth / Math.max(clientHeight, 1);
    this.camera.updateProjectionMatrix();
  }

  private animate = (): void => {
    if (!this.renderer || !this.scene || !this.camera || !this.sculpture) return;
    const time = this.reducedMotion ? 0 : performance.now() * 0.001;
    const scrollJourney = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 5.2);
    const directionShape = THREE.MathUtils.smoothstep(scrollJourney, 0.62, 1.48);
    const experienceShape = THREE.MathUtils.smoothstep(scrollJourney, 1.62, 2.48);
    const exitProgress = THREE.MathUtils.smoothstep(scrollJourney, 4.15, 4.95);
    const stage = this.threeStage.nativeElement;

    // Morph ribbon → wave → flowing silk while it becomes an ambient edge element.
    const ambientOpacity = THREE.MathUtils.lerp(1, 0.2, directionShape) + experienceShape * 0.16;
    const scale = 1 - directionShape * 0.36 + experienceShape * 0.08;
    const driftX = directionShape * 21 - experienceShape * 11;
    const driftY = directionShape * 12 - experienceShape * 8;
    stage.style.opacity = `${ambientOpacity * (1 - exitProgress)}`;
    stage.style.transform = `translate3d(${driftX}vw, calc(-50% + ${driftY}vh), 0) scale(${scale}) rotate(${directionShape * 5 - experienceShape * 8}deg)`;
    stage.style.filter = `blur(${directionShape * 0.3 - experienceShape * 0.18}px) saturate(${1 - directionShape * 0.24 + experienceShape * 0.18})`;
    stage.style.visibility = exitProgress > 0.995 ? 'hidden' : 'visible';

    this.sculpture.children.slice(0, 2).forEach((object) => {
      if (!(object instanceof THREE.Mesh) || !object.morphTargetInfluences) return;
      object.morphTargetInfluences[0] = directionShape * (1 - experienceShape);
      object.morphTargetInfluences[1] = experienceShape;
    });
    const pointerX = this.reducedMotion ? 0 : this.pointerX;
    const pointerY = this.reducedMotion ? 0 : this.pointerY;
    this.sculpture.rotation.y += (pointerX * 0.24 + time * 0.12 - this.sculpture.rotation.y) * 0.035;
    this.sculpture.rotation.x += (-0.34 + pointerY * 0.13 - this.sculpture.rotation.x) * 0.04;
    this.sculpture.rotation.z = -0.12 + directionShape * 0.2 - experienceShape * 0.15;
    this.sculpture.scale.setScalar(1 - directionShape * 0.04);
    this.sculpture.position.y = Math.sin(time * 0.7) * 0.12;

    this.sculpture.children.slice(2).forEach((pearl, index) => {
      const angle = pearl.userData['orbit'] + time * (0.12 + index * 0.006);
      pearl.position.y = Math.sin(angle * 2) * 0.72;
    });

    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame(this.animate);
  };

  ngOnDestroy(): void {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.resizeObserver?.disconnect();
    window.removeEventListener('pointermove', this.onPointerMove);
    this.scene?.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => material.dispose());
    });
    this.renderer?.dispose();
    this.renderer?.domElement.remove();
  }
}
