// Simple debug version for error redirect
console.log('🔧 Debug error redirect script loaded');

// Check if we're on the right page
console.log('Current URL:', window.location.href);
console.log('Search params:', window.location.search);

// Check for errors immediately
const urlParams = new URLSearchParams(window.location.search);
const urlError = urlParams.get('error');

console.log('URL Error parameter:', urlError);

if (urlError) {
    console.log('🚨 ERROR DETECTED:', urlError);
    
    // Build redirect URL
    const redirectUrl = 'https://app.valura.co.in/auth?error_code=' + urlError.toUpperCase() + '&error_message=' + encodeURIComponent('Error: ' + urlError) + '&timestamp=' + new Date().toISOString();
    
    console.log('🔄 Redirecting to:', redirectUrl);
    
    // Add a delay to see the console logs
    setTimeout(() => {
        window.location.href = redirectUrl;
    }, 2000);
} else {
    console.log('ℹ️ No error parameter found');
}

// Check for DOM errors too
setTimeout(() => {
    const errorElements = document.querySelectorAll('.pf-v5-c-alert.pf-m-danger');
    console.log('DOM error elements found:', errorElements.length);
    
    if (errorElements.length > 0) {
        errorElements.forEach((el, index) => {
            console.log(`Error ${index + 1}:`, el.textContent);
        });
        
        // Redirect on DOM errors too
        const redirectUrl = 'https://app.valura.co.in/auth?error_code=DOM_ERROR&error_message=' + encodeURIComponent('DOM error detected') + '&timestamp=' + new Date().toISOString();
        console.log('🔄 Redirecting for DOM error to:', redirectUrl);
        
        setTimeout(() => {
            window.location.href = redirectUrl;
        }, 2000);
    }
}, 1000);