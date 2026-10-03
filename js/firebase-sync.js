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
window.APP_STATE = null;

window.firebaseStateReady = new Promise((resolve) => {
    let resolved = false;
    
    // Timeout de 1.5 segundos por si no hay internet (para cargar local)
    const timeout = setTimeout(() => {
        if (!resolved) {
            resolved = true;
            console.log("Firebase timeout. Iniciando con datos locales.");
            resolve();
        }
    }, 1500);
    
    window.db.ref('velisima_data').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            window.APP_STATE = data;
            console.log("Datos sincronizados desde la nube.");
        } else {
            console.log("Base de datos en la nube vacía. Migrando datos locales...");
            migrateLocalToFirebase();
        }
        
        if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve();
        } else {
            // Actualización en tiempo real después de la primera carga
            window.dispatchEvent(new Event('firebaseUpdate'));
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
