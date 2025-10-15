/**
 * Mobile Breakpoint Trigger Utility
 * Programmatically applies mobile breakpoint styles when in mobile view
 * 
 * This utility scans all stylesheets for mobile breakpoint media queries
 * and creates duplicate rules that apply when .mobile-view is on the body.
 * This eliminates the need to manually duplicate mobile styles.
 * 
 * Navigation-related rules are excluded as they have special handling.
 */

export class MobileBreakpointTrigger {
    constructor() {
        this.injectedStylesheet = null;
        this.mobileBreakpoints = ['768px', '767px']; // Common mobile breakpoints
        this.processed = false;
        
        // Navigation-related selectors to exclude (they have special handling)
        this.navExcludePatterns = [
            '.sidebar',
            '.nav-group',
            '.nav-items',
            '.nav-link',
            '.mobile-menu-toggle',
            '.mobile-overlay',
            '.hamburger',
            '.sidebar-header',
            '.theme-controls'
        ];
    }

    /**
     * Process all stylesheets and extract mobile media query rules
     */
    processStylesheets() {
        if (this.processed) return;

        console.log('📱 Mobile Breakpoint Trigger: Scanning stylesheets...');
        
        const mobileRules = [];
        let stylesheetsScanned = 0;
        let mediaQueriesFound = 0;
        
        // Iterate through all stylesheets
        Array.from(document.styleSheets).forEach(stylesheet => {
            try {
                // Skip external stylesheets from different origins (CORS)
                if (stylesheet.href && !stylesheet.href.startsWith(window.location.origin)) {
                    return;
                }

                stylesheetsScanned++;
                
                // Process rules in this stylesheet
                const rules = this.extractMobileRules(stylesheet);
                if (rules.length > 0) {
                    mediaQueriesFound++;
                    mobileRules.push(...rules);
                }
            } catch (e) {
                // Ignore CORS errors for external stylesheets
                console.warn('⚠️ Could not access stylesheet:', stylesheet.href || 'inline', e);
            }
        });

        console.log(`📊 Scanned ${stylesheetsScanned} stylesheets, found ${mediaQueriesFound} mobile media queries`);
        
        // Create and inject new stylesheet with mobile-preview-active rules
        this.injectMobilePreviewStyles(mobileRules);
        this.processed = true;
    }

    /**
     * Extract mobile media query rules from a stylesheet
     */
    extractMobileRules(stylesheet) {
        const mobileRules = [];
        
        try {
            const rules = stylesheet.cssRules || stylesheet.rules;
            if (!rules) return mobileRules;

            Array.from(rules).forEach(rule => {
                // Check if it's a media rule
                if (rule.type === CSSRule.MEDIA_RULE) {
                    const mediaText = rule.media.mediaText.toLowerCase();
                    
                    // Check if it matches mobile breakpoints (max-width: 768px or similar)
                    if (this.isMobileBreakpoint(mediaText)) {
                        // Extract all CSS rules within this media query
                        const cssRules = Array.from(rule.cssRules);
                        cssRules.forEach(cssRule => {
                            if (cssRule.cssText) {
                                mobileRules.push(cssRule.cssText);
                            }
                        });
                    }
                }
            });
        } catch (e) {
            console.warn('Error extracting rules:', e);
        }

        return mobileRules;
    }

    /**
     * Check if media query matches mobile breakpoints
     */
    isMobileBreakpoint(mediaText) {
        // Match patterns like: (max-width: 768px), (max-width:768px), etc.
        const maxWidthRegex = /max-width\s*:\s*(\d+)px/;
        const match = mediaText.match(maxWidthRegex);
        
        if (match) {
            const width = parseInt(match[1], 10);
            // Consider it mobile if max-width is <= 768px
            return width <= 768;
        }
        
        return false;
    }

    /**
     * Check if a CSS rule contains navigation-related selectors
     */
    isNavigationRule(cssRule) {
        return this.navExcludePatterns.some(pattern => 
            cssRule.includes(pattern)
        );
    }

    /**
     * Inject styles that apply mobile rules to .mobile-view
     */
    injectMobilePreviewStyles(mobileRules) {
        // Create a new style element
        const styleElement = document.createElement('style');
        styleElement.id = 'mobile-view-breakpoint-styles';
        styleElement.setAttribute('data-generated', 'true');
        
        // Build CSS content
        let cssContent = '/* Auto-generated mobile view styles */\n\n';
        cssContent += '/* Apply mobile breakpoint styles when in mobile view (screen size OR mockup) */\n';
        cssContent += '/* Navigation rules are excluded - they have special handling */\n\n';
        cssContent += '@media (min-width: 769px) {\n'; // Only on desktop (for mockup mode)
        
        let injectedCount = 0;
        let skippedCount = 0;
        
        // Add each mobile rule, but scope it to .mobile-view (excluding nav rules)
        mobileRules.forEach(rule => {
            // Skip navigation-related rules
            if (this.isNavigationRule(rule)) {
                skippedCount++;
                return;
            }
            
            // Parse the rule to prefix selectors with .mobile-view
            const scopedRule = this.scopeRuleToMobileView(rule);
            if (scopedRule) {
                cssContent += `  ${scopedRule}\n`;
                injectedCount++;
            }
        });
        
        cssContent += '}\n';
        
        styleElement.textContent = cssContent;
        document.head.appendChild(styleElement);
        this.injectedStylesheet = styleElement;
        
        console.log(`✅ Mobile View Trigger: Successfully injected ${injectedCount} mobile rules`);
        console.log(`⏭️  Skipped ${skippedCount} navigation rules (special handling)`);
        console.log(`💡 Mobile view applies on screen resize OR mockup mode`);
    }

    /**
     * Scope a CSS rule to .mobile-view
     * This modifies selectors to apply when mobile-view class is active
     */
    scopeRuleToMobileView(cssRule) {
        try {
            // Extract selector and declarations
            const match = cssRule.match(/^([^{]+)\{([^}]*)\}$/);
            if (!match) return null;
            
            let selector = match[1].trim();
            const declarations = match[2].trim();
            
            if (!declarations) return null;
            
            // Split multiple selectors (e.g., "a, button")
            const selectors = selector.split(',').map(s => s.trim());
            
            // Scope each selector
            const scopedSelectors = selectors.map(sel => {
                // Skip if selector already includes .mobile-view
                if (sel.includes('.mobile-view')) {
                    return null;
                }
                
                // Handle :root or html selectors specially
                if (sel === ':root' || sel === 'html') {
                    return `.mobile-view`;
                }
                
                // Handle body selector
                if (sel === 'body' || sel.startsWith('body ')) {
                    return sel.replace(/^body/, '.mobile-view');
                }
                
                // For other selectors, prepend .mobile-view
                return `.mobile-view ${sel}`;
            }).filter(s => s !== null);
            
            if (scopedSelectors.length === 0) return null;
            
            // Reconstruct the rule
            return `${scopedSelectors.join(', ')} { ${declarations} }`;
        } catch (e) {
            console.warn('Error scoping rule:', cssRule, e);
            return null;
        }
    }
    
    /**
     * Legacy method name for backwards compatibility
     */
    scopeRuleToMobilePreview(cssRule) {
        return this.scopeRuleToMobileView(cssRule);
    }

    /**
     * Enable mobile view styles
     */
    enable() {
        if (!this.processed) {
            this.processStylesheets();
        }
        
        // Ensure body has the class
        document.body.classList.add('mobile-view');
    }

    /**
     * Disable mobile view styles
     */
    disable() {
        document.body.classList.remove('mobile-view');
    }

    /**
     * Clean up injected styles (useful for hot reload/development)
     */
    cleanup() {
        if (this.injectedStylesheet && this.injectedStylesheet.parentNode) {
            this.injectedStylesheet.parentNode.removeChild(this.injectedStylesheet);
            this.injectedStylesheet = null;
            this.processed = false;
        }
    }

    /**
     * Reinitialize (useful if stylesheets change)
     */
    reinitialize() {
        this.cleanup();
        this.processStylesheets();
    }
}

// Export singleton instance
export const mobileBreakpointTrigger = new MobileBreakpointTrigger();

