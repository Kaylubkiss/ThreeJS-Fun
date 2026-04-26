import * as THREE from 'three';
import { glContext } from './classes/glContext.js'


const sceneCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
sceneCamera.position.z = 5;
sceneCamera.lookAt(0,0,0);

const m_graphicsContext = new glContext(sceneCamera);

function main()
{
  {
		const skyColor = 0xB1E1FF; // light blue
		const groundColor = 0xB97A20; // brownish orange
		const intensity = 2;
		const light = new THREE.HemisphereLight( skyColor, groundColor, intensity );
		m_graphicsContext.addObjectToScene( light );
	}

  {

		const color = 0xFFFFFF;
		const intensity = 2.5;
		const light = new THREE.DirectionalLight( color, intensity );
		light.position.set( 5, 10, 2 );
    m_graphicsContext.addObjectToScene( light );

	}

  m_graphicsContext.loadObject('resources/cartoon_lowpoly_small_city_free_pack/scene.gltf');

  m_graphicsContext.setAnimationLoop();

  window.addEventListener('beforeunload', (event) => 
  {
    console.log("unloaded objects\n");
  });

}

main();