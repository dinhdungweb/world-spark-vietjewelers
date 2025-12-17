/**
 * Detects WebGL support in the browser
 * @returns true if WebGL is supported, false otherwise
 */
export function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch (e) {
    return false;
  }
}

/**
 * Gets WebGL context information for debugging
 * @returns Object with WebGL support details
 */
export function getWebGLInfo(): {
  supported: boolean;
  renderer?: string;
  vendor?: string;
  version?: string;
} {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      (canvas.getContext('webgl') as WebGLRenderingContext) ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext);

    if (!gl) {
      return { supported: false };
    }

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    
    return {
      supported: true,
      renderer: debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        : undefined,
      vendor: debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
        : undefined,
      version: gl.getParameter(gl.VERSION),
    };
  } catch (e) {
    return { supported: false };
  }
}
