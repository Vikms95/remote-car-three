import * as THREE from 'three';
import * as YUKA from 'yuka';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// Crea escena y adjuntamos el renderer al DOM
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setClearColor(0xa3a3a3);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


const carURL = new URL('./static/coche_amarillo.glb', import.meta.url);

// Crea la camara especificando el rango de visión y su posición
const camera = new THREE.PerspectiveCamera(
	45,
	window.innerWidth / window.innerHeight,
	0.1,
	1000
);

camera.position.set(0, 10, 4);
camera.lookAt(scene.position);

// Monta la luz con origen en la parte superior de la escena
const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
scene.add(directionalLight);

// Crea la entidad que se adjuntará al gltf
const vehicle = new YUKA.Vehicle();
vehicle.scale.set(0.15, 0.15, 0.15);

function sync(entity, renderComponent) {
	renderComponent.matrix.copy(entity.worldMatrix);
}

// Lleva la entidad a escena y le adjuntamos el hyperlink reference del gltf
const loader = new GLTFLoader();
loader.load(carURL.href, function (glb) {
	const model = glb.scene;
	model.matrixAutoUpdate = false;
	scene.add(model);
	vehicle.setRenderComponent(model, sync);
});

const entityManager = new YUKA.EntityManager();
entityManager.add(vehicle);

const target = new YUKA.GameEntity();
entityManager.add(target);

// Configura el comportamiento de la entidad cuando llegue al destino que se le marque
const seekBehavior = new YUKA.ArriveBehavior(target.position, 3, 0.5);
vehicle.steering.add(seekBehavior);
vehicle.position.set(-2, 0, -2);

// Crea la referencia a la posición del ratón
const mousePosition = new THREE.Vector2();

// Añade un listener al evento de movimiento del ratón
window.addEventListener('mousemove', function (e) {
	mousePosition.x = (e.clientX / this.window.innerWidth) * 2 - 1;
	mousePosition.y = -(e.clientY / this.window.innerHeight) * 2 + 1;
});

// Configura el area donde la entidad va a reconocer los clicks
const planeGeo = new THREE.PlaneGeometry(25, 25);
const planeMat = new THREE.MeshBasicMaterial({ visible: false });
const planeMesh = new THREE.Mesh(planeGeo, planeMat);
planeMesh.rotation.x = -0.5 * Math.PI;
planeMesh.name = 'plane';
scene.add(planeMesh);

// Crea el elemento que estará observando si el ratón 
// ejecuta una acción mientras está en el rango de reconocimiento de los clicks
const raycaster = new THREE.Raycaster();

window.addEventListener('click', function () {
	raycaster.setFromCamera(mousePosition, camera);
	const intersects = raycaster.intersectObjects(scene.children);
	for (let i = 0; i < intersects.length; i++) {
		if (intersects[i].object.name === 'plane')
			target.position.set(intersects[i].point.x, 0, intersects[i].point.z);
	}
});

// Crea el loop del videojuego
const time = new YUKA.Time();

function animate() {
	const delta = time.update().getDelta();
	entityManager.update(delta);
	renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

// Hace la pantalla responsive a reajustes de tamaño
window.addEventListener('resize', function () {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
});
