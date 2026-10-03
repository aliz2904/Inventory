// js/firebase-sync.js
const firebaseConfig = {
    apiKey: "AIzaSyBP2kw39_OQKMawDxZneYxFOxrgcDUajx0",
    authDomain: "velisima-app.firebaseapp.com",
    databaseURL: "https://velisima-app-default-rtdb.firebaseio.com",
    projectId: "velisima-app",
    storageBucket: "velisima-app.firebasestorage.app",
    messagingSenderId: "697424959343",
    appId: "1:697424959343:web:dafb6a6106cb8d04c5fa9a"
};

firebase.initializeApp(firebaseConfig);
window.db = firebase.database();
const auth = firebase.auth();
window.APP_STATE = null;

// Inject Login UI
const loginUI = `
<div id="velisima-login-overlay" style="position:fixed; top:0; left:0; width:100vw; height:100vh; background-color:#fff0f5; z-index:999999; display:flex; justify-content:center; align-items:center; flex-direction:column; font-family:system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <div style="background:white; padding:40px; border-radius:20px; box-shadow:0 10px 30px rgba(0,0,0,0.1); width:100%; max-width:400px; text-align:center;">
        <h2 style="color:#ff758c; margin-bottom:10px;">Acceso a Velisima</h2>
        <p style="color:#6c757d; margin-bottom:30px; font-size:0.9rem;">Por favor, inicia sesión para continuar</p>
        <form id="velisima-login-form">
            <input type="email" id="velisima-email" placeholder="Correo electrónico" required style="width:100%; padding:12px; margin-bottom:15px; border:1px solid #dee2e6; border-radius:10px; font-size:1rem; box-sizing:border-box;">
            <input type="password" id="velisima-password" placeholder="Contraseña" required style="width:100%; padding:12px; margin-bottom:20px; border:1px solid #dee2e6; border-radius:10px; font-size:1rem; box-sizing:border-box;">
            <button type="submit" style="width:100%; padding:12px; background:linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%); color:white; border:none; border-radius:10px; font-size:1.1rem; font-weight:bold; cursor:pointer;">Ingresar</button>
        </form>
        <p id="velisima-login-error" style="color:red; margin-top:15px; font-size:0.9rem; display:none;"></p>
    </div>
</div>
`;
document.write(loginUI);

let dbListener = null;

window.firebaseStateReady = new Promise((resolve) => {
    
    auth.onAuthStateChanged(user => {
        const overlay = document.getElementById('velisima-login-overlay');
        
        if (user) {
            // User is signed in
            if (overlay) overlay.style.display = 'none';
            
            // Start listening to the database
            if (!dbListener) {
                let resolved = false;
                
                dbListener = window.db.ref('velisima_data').on('value', (snapshot) => {
                    const data = snapshot.val();
                    
                    if (data && data.products && data.products.length > 0) {
                        window.APP_STATE = data;
                        console.log("Datos sincronizados desde la nube.");
                    } else {
                        console.log("Nube vacía o incompleta. Migrando datos locales fuertes...");
                        migrateLocalToFirebase();
                    }
                    
                    if (!resolved) {
                        resolved = true;
                        resolve(); // Ready to boot the app
                    } else {
                        window.dispatchEvent(new Event('firebaseUpdate'));
                    }
                }, (error) => {
                    console.error("Error de permisos en Firebase:", error);
                    // Fallback to local storage if permission denied
                    if (!resolved) {
                        resolved = true;
                        resolve(); 
                    }
                });
            }
        } else {
            // User is signed out
            if (overlay) overlay.style.display = 'flex';
            
            // Si cierran sesión, detenemos el listener de la base de datos
            if (dbListener) {
                window.db.ref('velisima_data').off('value', dbListener);
                dbListener = null;
            }
            
            const form = document.getElementById('velisima-login-form');
            if (form) {
                form.onsubmit = (e) => {
                    e.preventDefault();
                    const email = document.getElementById('velisima-email').value;
                    const pass = document.getElementById('velisima-password').value;
                    const errorP = document.getElementById('velisima-login-error');
                    errorP.style.display = 'none';
                    
                    auth.signInWithEmailAndPassword(email, pass)
                        .catch(err => {
                            errorP.textContent = "Credenciales inválidas. " + err.message;
                            errorP.style.display = 'block';
                        });
                };
            }
        }
    });
});

function migrateLocalToFirebase() {
    const localData = {
        config: JSON.parse(localStorage.getItem('velisima_config') || 'null'),
        fragancias: JSON.parse(localStorage.getItem('velisima_fragancias') || 'null'),
        products: JSON.parse(localStorage.getItem('velisima_products') || 'null'),
        orders: JSON.parse(localStorage.getItem('velisima_orders') || 'null'),
        quotes: JSON.parse(localStorage.getItem('velisima_quotes') || 'null'),
        insumos: JSON.parse(localStorage.getItem('velisima_insumos') || 'null')
    };
    
    if (localData.config || localData.products) {
        window.db.ref('velisima_data').set(localData);
        window.APP_STATE = localData;
    } else {
        window.APP_STATE = {}; 
    }
}
