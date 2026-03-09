import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { createNoise3D } from 'simplex-noise';
import * as THREE from 'three';
import { ThemeService } from '../../services/theme.service';



@Component({
  selector: 'app-hero',
  standalone: true,
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
})

export class HeroComponent implements AfterViewInit, OnDestroy {
  constructor(private themeService: ThemeService) {}
  
  @ViewChild('canvas3d', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private animId?: number;
  private mesh!: THREE.Mesh;
  private glowMesh!: THREE.Mesh;
  private directionalLight!: THREE.DirectionalLight;

  // Noise
  private noise3D = createNoise3D();
  private time = 0;



  ngAfterViewInit(): void {
    this.initScene();
    this.animate();

    window.addEventListener('resize', this.onResize);
    window.addEventListener('mousemove', this.onMouseMove);
    this.initMagneticButtons();

// Listen for theme changes
this.themeService.onThemeChange.subscribe(() => {
  this.applyThemeToScene();
});


  }

  private initScene(): void {
    const canvas = this.canvasRef.nativeElement;
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.scene = new THREE.Scene();

    const getCss = (name: string) =>
      getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    this.scene.background = new THREE.Color(getCss("--three-bg"));

    this.camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
    this.camera.position.set(0, 0, 4);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    const directional = new THREE.DirectionalLight(getCss("--three-light"), 1.2);
    directional.position.set(2, 2, 4);
    this.scene.add(ambient, directional);

    this.directionalLight = new THREE.DirectionalLight(getCss("--accent-color-light"), 1.2);
this.scene.add(this.directionalLight);


    const geometry = new THREE.IcosahedronGeometry(1, 2);
    const material = new THREE.MeshStandardMaterial({
  color: getCss("--three-mesh"),
  metalness: 0.4,
  roughness: 0.3
});

    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);

    // --- AURA GLOW SPHERE ---
    const glowGeometry = new THREE.IcosahedronGeometry(1.4, 2);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: getCss("--three-glow"),
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    this.scene.add(glowMesh);

    // Reference it for animation
    this.glowMesh = glowMesh;
  }

  private animate = (): void => {
    this.animId = requestAnimationFrame(this.animate);
    this.mesh.rotation.x += 0.02; 
    this.mesh.rotation.y += 0.025;
    this.renderer.render(this.scene, this.camera);
    this.mesh.position.y = Math.sin(performance.now() * 0.001) * 0.2;
    this.glowMesh.rotation.y -= 0.004;
    this.glowMesh.rotation.x -= 0.002;

    this.time += 0.003;

const position = this.mesh.geometry.attributes['position'];
const vertex = new THREE.Vector3();

for (let i = 0; i < position.count; i++) {
  vertex.fromBufferAttribute(position, i);

  // Noise using the new createNoise3D()
  const noise = this.noise3D(
    vertex.x + this.time,
    vertex.y + this.time,
    vertex.z + this.time
  ) * 0.25;

  vertex.normalize().multiplyScalar(1 + noise);
  position.setXYZ(i, vertex.x, vertex.y, vertex.z);
}

position.needsUpdate = true;
this.mesh.geometry.computeVertexNormals();
this.renderer.render(this.scene, this.camera);

  };

  private onResize = (): void => {
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

private onMouseMove = (event: MouseEvent): void => {
  const x = (event.clientX / window.innerWidth) * 2 - 1;
  const y = -(event.clientY / window.innerHeight) * 2 + 1;

  // mesh reacts
  this.mesh.rotation.x += y * 0.03;
  this.mesh.rotation.y += x * 0.03;

  // camera parallax
  this.camera.position.x = x * 0.4;
  this.camera.position.y = y * 0.3;
  this.camera.lookAt(this.scene.position);
};

private applyThemeToScene(): void {
  if (!this.scene || !this.mesh || !this.glowMesh) return;

  const getCss = (name: string) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  // Update Three.js scene colors dynamically
  this.scene.background = new THREE.Color(getCss("--three-bg"));

  (this.mesh.material as THREE.MeshStandardMaterial).color.set(getCss("--three-mesh"));

  (this.glowMesh.material as THREE.MeshBasicMaterial).color.set(getCss("--three-glow"));

  this.directionalLight.color.set(getCss("--three-light"));

  this.renderer.render(this.scene, this.camera);
}


private initMagneticButtons() {
  const buttons = document.querySelectorAll('.magnetic-btn');

  buttons.forEach((btn: any) => {
    const strength = 40;

    btn.addEventListener('mousemove', (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      gsap.to(btn, {
        x: x / 3,
        y: y / 3,
        duration: 0.3,
        ease: "power2.out",
      });
    });

    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, {
        x: 0,
        y: 0,
        duration: 0.4,
        ease: "power3.out",
      });
    });
  });
}


  ngOnDestroy(): void {
    cancelAnimationFrame(this.animId!);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mousemove', this.onMouseMove);
    this.renderer.dispose();
  }
}
