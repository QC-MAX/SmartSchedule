// frontend/js/utils/auth.js - COMPLETE FIXED VERSION
// (API_URL is available from api.js via window.API_URL)

async function loginUser(studentId, password) {
    try {
        console.log('🔐 Attempting login with:', studentId);
        
        const response = await fetch(`${window.API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_id: studentId, password })
        });

        const data = await response.json();

        if (!response.ok) {
            return { success: false, error: data.error || 'Login failed' };
        }

        localStorage.setItem('studentData', JSON.stringify(data));
        
        const redirectUrl = data.role === 'Faculty' 
            ? '/faculty-dashboard' 
            : '/student-dashboard';
        
        setTimeout(() => {
            window.location.href = redirectUrl;
        }, 100);

        return { success: true, data: data };

    } catch (error) {
        console.error('❌ Login error:', error);
        return { success: false, error: error.message };
    }
}

function checkAuth() {
    const userData = localStorage.getItem('studentData');
    
    if (!userData) {
        console.warn('⚠️ No user data found');
        window.location.href = '/login';
        return null;
    }
    
    try {
        return JSON.parse(userData);
    } catch (e) {
        localStorage.removeItem('studentData');
        window.location.href = '/login';
        return null;
    }
}

function logout() {
    console.log('🚪 Logging out...');
    localStorage.removeItem('studentData');
    window.location.href = '/login';
}

function getUserData() {
    const userData = localStorage.getItem('studentData');
    return userData ? JSON.parse(userData) : null;
}

// Make globally available
window.loginUser = loginUser;
window.checkAuth = checkAuth;
window.logout = logout;
window.getUserData = getUserData;

console.log('✅ Auth utilities loaded');