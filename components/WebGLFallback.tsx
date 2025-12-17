'use client';

import React from 'react';

/**
 * Fallback component displayed when WebGL is not supported
 * Provides helpful information and suggestions for users
 */
export default function WebGLFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card border border-card-border rounded-xl p-6 max-w-md w-full shadow-card animate-fade-in">
        <h2 className="text-xl text-yellow-400/90 mb-4 font-light">WebGL Not Supported</h2>
        <p className="text-muted-foreground mb-5 font-light leading-relaxed">
          World Spark requires WebGL to display the 3D globe. Unfortunately, your browser
          does not support WebGL or it is disabled.
        </p>
        
        <div className="mb-5">
          <h3 className="text-sm text-muted mb-2 font-medium">What you can try:</h3>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside font-light">
            <li>Update your browser to the latest version</li>
            <li>Try a different browser (Chrome, Firefox, Safari, or Edge)</li>
            <li>Enable hardware acceleration in your browser settings</li>
            <li>Update your graphics drivers</li>
          </ul>
        </div>

        <div className="mb-5">
          <h3 className="text-sm text-muted mb-2 font-medium">Supported browsers:</h3>
          <p className="text-sm text-muted-foreground font-light">
            Chrome 56+, Firefox 52+, Safari 11+, Edge 79+
          </p>
        </div>

        <a
          href="https://get.webgl.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-4 py-2.5 bg-accent hover:bg-accent-hover text-foreground/90 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          Learn more about WebGL
        </a>
      </div>
    </div>
  );
}
