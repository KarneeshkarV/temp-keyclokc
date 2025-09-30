/**
 * Keycloak Error Redirect Handler
 * Automatically redirects users to a custom URL when error messages are displayed
 */

class ErrorRedirectHandler {
    constructor(config = {}) {
        this.config = {
            enableRedirect: config.enableRedirect !== false,
            redirectUrl: config.redirectUrl || '',
            redirectDelay: config.redirectDelay || 0,
            preserveParams: config.preserveParams !== false,
            errorSelector: config.errorSelector || '.pf-v5-c-alert.pf-m-danger',
            debugMode: config.debugMode || false
        };
        
        this.init();
    }

    init() {
        if (!this.config.enableRedirect || !this.config.redirectUrl) {
            this.log('Error redirect disabled or no redirect URL configured');
            return;
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.checkForErrors());
        } else {
            this.checkForErrors();
        }
    }

    checkForErrors() {
        // Check for URL-based errors first (like error=cancelledOnApp)
        const urlParams = new URLSearchParams(window.location.search);
        const urlError = urlParams.get('error');
        
        if (urlError) {
            this.log('URL-based error detected:', urlError);
            const errorData = this.extractUrlErrorData(urlError, urlParams);
            this.performRedirect(errorData);
            return;
        }
        
        // Check for DOM-based error messages
        const errorElements = document.querySelectorAll(this.config.errorSelector);
        
        if (errorElements.length > 0) {
            this.log('DOM-based error detected, preparing redirect');
            
            errorElements.forEach((errorElement, index) => {
                const errorData = this.extractErrorData(errorElement, index);
                this.log('Error data extracted:', errorData);
                
                if (index === 0) {
                    this.performRedirect(errorData);
                }
            });
        } else {
            this.log('No errors detected');
        }
    }

    extractUrlErrorData(urlError, urlParams) {
        const errorCodeMap = {
            'cancelledOnApp': 'CANCELLED_ON_APP',
            'access_denied': 'ACCESS_DENIED',
            'invalid_request': 'INVALID_REQUEST',
            'unauthorized_client': 'UNAUTHORIZED_CLIENT',
            'unsupported_response_type': 'UNSUPPORTED_RESPONSE_TYPE',
            'invalid_scope': 'INVALID_SCOPE',
            'server_error': 'SERVER_ERROR',
            'temporarily_unavailable': 'TEMPORARILY_UNAVAILABLE'
        };
        
        const mappedCode = errorCodeMap[urlError] || urlError.toUpperCase();
        const errorDescription = urlParams.get('error_description') || this.getErrorMessageFromCode(mappedCode);
        
        return {
            message: errorDescription,
            code: mappedCode,
            timestamp: new Date().toISOString(),
            source: 'keycloak_url_params',
            originalError: urlError,
            state: urlParams.get('state'),
            sp: urlParams.get('sp')
        };
    }

    extractErrorData(errorElement) {
        const errorMessage = this.getErrorMessage(errorElement);
        const errorCode = this.getErrorCode(errorElement, errorMessage);
        
        return {
            message: errorMessage,
            code: errorCode,
            timestamp: new Date().toISOString(),
            source: 'keycloak_theme'
        };
    }

    getErrorMessage(errorElement) {
        const titleElement = errorElement.querySelector('.pf-v5-c-alert__title');
        if (titleElement) {
            return titleElement.textContent.trim();
        }
        
        return errorElement.textContent.trim() || 'Unknown error occurred';
    }

    getErrorCode(errorElement, errorMessage) {
        const urlParams = new URLSearchParams(window.location.search);
        const authError = urlParams.get('error');
        
        if (authError) {
            return authError;
        }
        
        const errorCodeMap = {
            'Invalid username or password': 'INVALID_CREDENTIALS',
            'Account is disabled': 'ACCOUNT_DISABLED',
            'Account is not verified': 'ACCOUNT_NOT_VERIFIED',
            'Too many login attempts': 'TOO_MANY_ATTEMPTS',
            'Session has expired': 'SESSION_EXPIRED',
            'Access denied': 'ACCESS_DENIED'
        };
        
        for (const [messagePattern, code] of Object.entries(errorCodeMap)) {
            if (errorMessage.toLowerCase().includes(messagePattern.toLowerCase())) {
                return code;
            }
        }
        
        return 'GENERIC_ERROR';
    }

    getErrorMessageFromCode(errorCode) {
        const messageMap = {
            'CANCELLED_ON_APP': 'Authentication was cancelled in the mobile app',
            'ACCESS_DENIED': 'Access to the requested resource was denied',
            'INVALID_REQUEST': 'The authentication request was invalid',
            'UNAUTHORIZED_CLIENT': 'The client is not authorized to make this request',
            'UNSUPPORTED_RESPONSE_TYPE': 'The response type is not supported',
            'INVALID_SCOPE': 'The requested scope is invalid',
            'SERVER_ERROR': 'An internal server error occurred',
            'TEMPORARILY_UNAVAILABLE': 'The service is temporarily unavailable',
            'INVALID_CREDENTIALS': 'Invalid username or password',
            'ACCOUNT_DISABLED': 'Account is disabled',
            'ACCOUNT_NOT_VERIFIED': 'Account is not verified',
            'TOO_MANY_ATTEMPTS': 'Too many login attempts',
            'SESSION_EXPIRED': 'Session has expired',
            'GENERIC_ERROR': 'An unknown error occurred'
        };
        
        return messageMap[errorCode] || `Error: ${errorCode}`;
    }

    buildRedirectUrl(errorData) {
        const url = new URL(this.config.redirectUrl);
        
        url.searchParams.set('error_code', errorData.code);
        url.searchParams.set('error_message', errorData.message);
        url.searchParams.set('timestamp', errorData.timestamp);
        url.searchParams.set('source', errorData.source);
        
        if (this.config.preserveParams) {
            const currentParams = new URLSearchParams(window.location.search);
            for (const [key, value] of currentParams) {
                if (!url.searchParams.has(key)) {
                    url.searchParams.set(key, value);
                }
            }
        }
        
        return url.toString();
    }

    performRedirect(errorData) {
        const redirectUrl = this.buildRedirectUrl(errorData);
        this.log('Redirecting to:', redirectUrl);
        
        if (this.config.redirectDelay > 0) {
            this.showRedirectNotice(this.config.redirectDelay);
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, this.config.redirectDelay);
        } else {
            window.location.href = redirectUrl;
        }
    }

    showRedirectNotice(delay) {
        const notice = document.createElement('div');
        notice.className = 'kc-error-redirect-notice';
        notice.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #f0f0f0;
            border: 1px solid #ccc;
            padding: 10px 20px;
            border-radius: 4px;
            z-index: 9999;
            font-family: inherit;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        `;
        notice.textContent = `Redirecting in ${Math.ceil(delay / 1000)} seconds...`;
        
        document.body.appendChild(notice);
        
        setTimeout(() => {
            if (notice.parentNode) {
                notice.parentNode.removeChild(notice);
            }
        }, delay);
    }

    log(message, data = null) {
        if (this.config.debugMode) {
            if (data) {
                console.log('[ErrorRedirect]', message, data);
            } else {
                console.log('[ErrorRedirect]', message);
            }
        }
    }
}

// Auto-initialize when included in Keycloak theme
if (typeof window !== 'undefined' && window.document) {
    window.ErrorRedirectHandler = ErrorRedirectHandler;
    
    // Auto-initialize with theme properties if available
    if (window.kcErrorRedirectConfig) {
        new ErrorRedirectHandler(window.kcErrorRedirectConfig);
    }
}

// Export for module systems if available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorRedirectHandler;
}