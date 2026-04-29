import * as THREE from 'three';

export class ResourceTracker
{
  constructor()
  {
    this.m_resources = new Set();

    window.addEventListener('beforeunload', () => 
    {
      this.dispose();

      console.log("unloaded objects\n");
    });
  }

  track(resource)
  {
    if (!resource)
    {
      return resource;
    }

    if (resource instanceof THREE.Object3D)
    {
      this.m_resources.add(resource);
      if (resource instanceof THREE.Mesh)
      {
        resource.castShadow = true;
        resource.receiveShadow = true;
      }

      //traverse the children objects
      resource.traverse((object) => 
      {

        if (object instanceof THREE.Mesh)
        {
          object.castShadow = true;
          object.receiveShadow = true;
        }

        this.track(object.geometry);

        if (Array.isArray(object.material))
        {
          object.material.forEach((material) => this.track(material));
        }
        else
        {
          this.track(object.material);
        }
      });
    }
    else if (resource instanceof THREE.Material)
    {
      for (const value of Object.values(resource))
      {
        if (value instanceof THREE.Texture)
        {
          this.track(value);
        }
      }
    }
    else if (resource.dispose)
    {
      this.m_resources.add(resource);
    }
    
    //we can initialize a uniform as an array of attributes, so we need to make sure we track the textures (sampler) referenced inside.
    if (resource.uniforms)
    {
      for (const value of Object.values(resource.uniforms))
      {
        if (value instanceof THREE.Texture || Array.isArray(value))
        {
          this.track(value);
        }
      }
    }

    return resource;
  }

  dispose()
  {
    let resourceCount = this.m_resources.size;

    for(const resource of this.m_resources)
    {
      if (resource instanceof THREE.Object3D)
      {
        if (resource.parent)
        {
          resource.parent.remove(resource);
        }
      }
      
      if (resource.dispose)
      {
        resource.dispose();
      }
    }

    console.log("disposed of " + resourceCount.toString() + " items\n");

    this.m_resources.clear();
  }


}