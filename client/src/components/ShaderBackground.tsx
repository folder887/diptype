import { useEffect, useRef } from 'react';

/**
 * Мягкий анимированный WebGL-фон: переливающиеся волны в сине-белой палитре.
 * Без неона — приглушённые тона, плавное движение, лёгкое зерно.
 * Гладко деградирует: если WebGL недоступен, остаётся CSS-градиент.
 */
const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;

// псевдошум
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i+vec2(0.0,0.0)), hash(i+vec2(1.0,0.0)), u.x),
             mix(hash(i+vec2(0.0,1.0)), hash(i+vec2(1.0,1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0; float a = 0.5;
  for(int i=0;i<5;i++){ v += a*noise(p); p *= 2.0; a *= 0.5; }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  vec2 p = uv * 3.0;
  float t = u_time * 0.06;

  float f = fbm(p + vec2(t, t*0.7));
  f += 0.4 * fbm(p*2.0 - vec2(t*0.5, t));

  // палитра: белый -> голубой -> синий (без насыщенного неона)
  vec3 white = vec3(1.0, 1.0, 1.0);
  vec3 light = vec3(0.85, 0.91, 0.99);
  vec3 blue  = vec3(0.15, 0.39, 0.92); // ~ brand-600
  vec3 deep  = vec3(0.12, 0.25, 0.55);

  float m = smoothstep(0.2, 0.9, f);
  vec3 col = mix(white, light, smoothstep(0.0, 0.5, f));
  col = mix(col, blue, m * 0.55);
  col = mix(col, deep, smoothstep(0.7, 1.0, f) * 0.25);

  // мягкая виньетка к краям
  float d = distance(uv, vec2(0.5));
  col = mix(col, light, smoothstep(0.4, 0.95, d) * 0.4);

  gl_FragColor = vec4(col, 1.0);
}
`;

const VERT = `
attribute vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

export default function ShaderBackground({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { antialias: true, alpha: false });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uTime = gl.getUniformLocation(prog, 'u_time');

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    let raf = 0;
    const start = performance.now();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const render = (now: number) => {
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, reduce ? 6 : (now - start) / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!reduce) raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className={className}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(160deg,#ffffff,#dbeafe)',
      }}
    />
  );
}
