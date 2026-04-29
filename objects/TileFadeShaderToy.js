export class TileFadeShaderToy 
{
  static vertexShader =
  ` out vec2 outUV;
    void main() 
    {
      outUV = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
    `; 

  static fragmentShader = `
    #include <common>

    uniform float uTime;
    uniform sampler2D textureSampler;

    // By Daedelus: https://www.shadertoy.com/user/Daedelus
    // license: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
    #define TIMESCALE 0.25
    #define TILES 8
    #define COLOR 0.7, 1.6, 2.8
    
    in vec2 outUV;
    out vec4 outColor;

    void main() {

      vec2 uv = outUV.xy;

      vec3 texture_color = texture(textureSampler, uv).rgb;
      
      vec4 noise = texture2D(textureSampler, floor(uv * float(TILES)) / float(TILES));
      float p = 1.0 - mod(noise.r + noise.g + noise.b + uTime * float(TIMESCALE), 1.0);
      p = min(max(p * 3.0 - 1.8, 0.1), 2.0);

      vec2 r = mod(uv * float(TILES), 1.0);
      r = vec2(pow(r.x - 0.5, 2.0), pow(r.y - 0.5, 2.0));
      p *= 1.0 - pow(min(1.0, 12.0 * dot(r, r)), 2.0);

      outColor = vec4(texture_color, 1.0) * p;
    }
    `;
}