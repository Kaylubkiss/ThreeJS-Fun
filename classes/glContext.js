/* 
  * @author Caleb Kissinger
*/

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ResourceTracker } from './resourceTracker.js';

export class glContext 
{
  constructor(camera)
  {
    this.m_scene = new THREE.Scene();
    this.m_camera = camera;
    this.m_GLTFloader = new GLTFLoader();

    this.m_resourceTracker = new ResourceTracker(); 

    this.m_width = window.innerWidth;
    this.m_height = window.innerHeight;
    
    const mainView = document.querySelector("#mainView");

    this.m_renderer = new THREE.WebGLRenderer({ canvas: mainView });
    
    this.m_renderer.setSize(window.innerWidth, window.innerHeight);

    this.m_renderer.shadowMap.enabled = true;
    
    this.m_controls = new OrbitControls(this.m_camera, mainView );
    this.m_controls.update();
    
    document.body.appendChild( this.m_renderer.domElement );
  }

  #loadObjectCallback( gltf )
  {
    const root = gltf.scene;
    
    this.m_scene.add( this.m_resourceTracker.track(root) );
    
    // want to reframe the camera to cover the whole env/object.
    const box = new THREE.Box3().setFromObject( root );
    const boxSize = box.getSize( new THREE.Vector3() ).length();
    const boxCenter = box.getCenter( new THREE.Vector3() );

    root.position.sub(boxCenter);

    root.updateWorldMatrix(1, 1);

    this.setFrameArea( boxSize * 0.5, boxSize, boxCenter );

    this.m_controls.maxDistance = boxSize * 10;
    this.m_controls.target.copy( boxCenter );
    this.m_controls.update();

    console.log("successfully loaded scene\n");
  }

  static loadObjectErrorCallback( error )
  {
    console.error( error );
  }

  loadObject(path)
  {
    this.m_GLTFloader.load(path, (gltf) => this.#loadObjectCallback(gltf), 
      undefined, 
      glContext.loadObjectErrorCallback);
  }

  addObjectToScene( obj, focusOnObject = false )
  {

    this.m_scene.add( this.m_resourceTracker.track(obj) );

    if (focusOnObject)
    {
      const box = new THREE.Box3().setFromObject( obj );
      const boxSize = box.getSize( new THREE.Vector3() ).length();
      const boxCenter = box.getCenter( new THREE.Vector3() );

      this.setFrameArea(boxSize * 0.5, boxSize, boxCenter );
    }

    console.log("added an object to the scene\n");
  }

  addSceneBackground( background, isEnvironment = false )
  {
    this.m_scene.background = this.m_resourceTracker.track(background);

    if (isEnvironment == true)
    {
      this.m_scene.environment = background;
    }
  }

  resize()
  {
    this.m_width = window.innerWidth;
    this.m_height = window.innerHeight;

    this.m_renderer.setSize(this.m_width, this.m_height);
    this.m_camera.aspect = this.m_width / this.m_height;
    this.m_camera.updateProjectionMatrix();

  }

  #needsResize()
  {
    return (document.innerWidth != this.m_width || document.innerHeight != this.m_height);
  }

  render()
  {
    if (this.#needsResize())
    {
      this.resize();
    }
    
    this.m_renderer.render(this.m_scene, this.m_camera);
  }

  getRenderer()
  {
    return this.m_renderer;
  }

  getScene()
  {
    return this.m_scene;
  }

  setFrameArea( sizeToFitOnScreen, boxSize, boxCenter )
  {
    const halfSizeToFitOnScreen = sizeToFitOnScreen * 0.5;
    const halfFovY = THREE.MathUtils.degToRad( this.m_camera.fov * 0.5 );
    const distance = halfSizeToFitOnScreen / Math.tan( halfFovY );

    const direction = ( new THREE.Vector3() )
      .subVectors( this.m_camera.position, boxCenter ) //camerapos - boxCenter
      .multiply( new THREE.Vector3(1, 0, 1))
      .normalize();

    this.m_camera.position.copy( direction.multiplyScalar(distance).add(boxCenter) ); //pushing the camera out

    this.m_camera.near = boxSize / 100;
    this.m_camera.far = boxSize * 100;

    this.m_camera.updateProjectionMatrix();

    this.m_camera.lookAt( boxCenter.x, boxCenter.y, boxCenter.z );

  }

}