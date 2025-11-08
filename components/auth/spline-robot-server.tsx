"use client";

import { useEffect, useRef } from 'react';
import Spline from '@splinetool/react-spline';

export default function SplineRobotServer() {
  const splineRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Aggressive watermark removal
    const hideWatermark = () => {
      // Find all links in the document
      const allLinks = document.querySelectorAll('a');
      allLinks.forEach((link: any) => {
        const href = link.getAttribute('href') || link.href || '';
        const text = (link.textContent || link.innerText || '').toLowerCase();

        // Check if it's a Spline watermark link
        if (
          (href.includes('spline.design') && !href.includes('prod.spline.design')) ||
          href.includes('splinetool.com') ||
          text.includes('built with spline') ||
          text.includes('built by spline') ||
          (text.includes('spline') && (href.includes('spline') || !href))
        ) {
          link.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; position: absolute !important; left: -9999px !important; width: 0 !important; height: 0 !important;';
          link.remove();
        }
      });

      // Find all elements and check their text content
      const allElements = document.querySelectorAll('*');
      allElements.forEach((el: any) => {
        if (el.tagName === 'A' || el.tagName === 'BUTTON') {
          const text = (el.textContent || el.innerText || '').toLowerCase();
          const href = el.getAttribute('href') || el.href || '';

          if (
            text.includes('built with spline') ||
            text.includes('built by spline') ||
            (text.includes('spline') && (href.includes('spline.design') || href.includes('splinetool.com')))
          ) {
            el.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important;';
            el.remove();
          }
        }
      });

      // Check container specifically
      if (containerRef.current) {
        const containerLinks = containerRef.current.querySelectorAll('a, button');
        containerLinks.forEach((el: any) => {
          const text = (el.textContent || el.innerText || '').toLowerCase();
          const href = el.getAttribute('href') || el.href || '';

          if (
            text.includes('built with') ||
            text.includes('built by') ||
            (href && href.includes('spline') && !href.includes('prod.spline.design'))
          ) {
            el.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important;';
            el.remove();
          }
        });
      }

      // Look for elements positioned at bottom (typical watermark position)
      const positionedElements = document.querySelectorAll('[style*="bottom"], [style*="position"]');
      positionedElements.forEach((el: any) => {
        try {
          if (!el || !el.ownerDocument) return;

          const style = window.getComputedStyle(el);
          if (!style) return;

          const text = (el.textContent || el.innerText || '').toLowerCase();

          if (text.includes('built with') || text.includes('built by') || text.includes('spline')) {
            const position = style?.position;
            const bottom = style?.bottom;
            const top = style?.top;

            if (position && (position === 'absolute' || position === 'fixed')) {
              const bottomValue = bottom ? parseInt(bottom) : null;
              const topValue = top ? parseInt(top) : null;

              if (
                (bottomValue !== null && bottomValue >= 0) ||
                (topValue !== null && topValue > (window.innerHeight * 0.7))
              ) {
                el.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important;';
                el.remove();
              }
            }
          }
        } catch (e) {
          // Skip elements that can't be accessed
        }
      });
    };

    // Run immediately
    hideWatermark();

    // Use MutationObserver to watch for DOM changes
    const observer = new MutationObserver(() => {
      hideWatermark();
    });

    // Observe the entire document
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'href']
    });

    // Also run on intervals to catch any missed elements
    const interval1 = setInterval(hideWatermark, 500);
    const interval2 = setInterval(hideWatermark, 2000);
    const interval3 = setInterval(hideWatermark, 5000);

    // Clean up after 30 seconds
    setTimeout(() => {
      clearInterval(interval1);
      clearInterval(interval2);
      clearInterval(interval3);
    }, 30000);

    return () => {
      observer.disconnect();
      clearInterval(interval1);
      clearInterval(interval2);
      clearInterval(interval3);
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Aggressive Spline watermark hiding */
          a[href*="spline.design"]:not([href*="prod.spline.design"]),
          a[href*="splinetool.com"],
          a[target="_blank"][href*="spline"],
          button:has-text("Built with Spline"),
          button:has-text("Built by Spline"),
          a:has-text("Built with Spline"),
          a:has-text("Built by Spline") {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
            position: absolute !important;
            left: -9999px !important;
            width: 0 !important;
            height: 0 !important;
            overflow: hidden !important;
          }
          
          /* Hide watermark in canvas/iframe containers */
          canvas + a,
          iframe + a,
          canvas ~ a,
          iframe ~ a {
            display: none !important;
          }
          
          /* Target elements at bottom of container */
          [style*="bottom"] a,
          [style*="bottom"] button {
            display: none !important;
          }
        `
      }} />
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ width: '100%', height: '100%', minHeight: '100%', position: 'relative', overflow: 'hidden' }}
      >
        <Spline
          scene="https://prod.spline.design/eU6eRuH7qcl-fpCL/scene.splinecode"
          onLoad={(spline) => {
            splineRef.current = spline;
            // Aggressive cleanup after load
            const cleanup = () => {
              const allLinks = document.querySelectorAll('a, button');
              allLinks.forEach((el: any) => {
                const text = (el.textContent || el.innerText || '').toLowerCase();
                const href = el.getAttribute('href') || el.href || '';

                if (
                  text.includes('built with spline') ||
                  text.includes('built by spline') ||
                  (href && href.includes('spline') && !href.includes('prod.spline.design'))
                ) {
                  el.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important;';
                  el.remove();
                }
              });
            };

            // Run cleanup multiple times
            setTimeout(cleanup, 500);
            setTimeout(cleanup, 1000);
            setTimeout(cleanup, 2000);
            setTimeout(cleanup, 3000);
            setTimeout(cleanup, 5000);
          }}
        />
      </div>
    </>
  );
}

