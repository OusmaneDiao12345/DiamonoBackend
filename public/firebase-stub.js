// Firebase Stub - Local fallback for offline mode
window.firebase = {
    apps: [],
    SDK_VERSION: '10.7.0',
    
    initializeApp: function(config) {
        console.log('🔧 Firebase stub initialized (offline mode)');
        this.apps = [{name: 'default'}];
        return {
            name: 'default',
            config: config
        };
    },
    
    auth: function() {
        return {
            onAuthStateChanged: function(callback) {
                // Simulate logged-in user for offline demo
                setTimeout(() => {
                    callback({
                        email: 'admin@diamanosn.test',
                        uid: 'demo-admin-123',
                        getIdToken: async function() {
                            return 'demo-token-' + Date.now();
                        }
                    });
                }, 500);
            },
            signOut: function() {
                return Promise.resolve();
            }
        };
    },
    
    firestore: function() {
        return {
            collection: function(name) {
                return {
                    get: async function() {
                        console.log('📄 Fetching ' + name + ' (offline mode)');
                        return {
                            docs: []
                        };
                    }
                };
            }
        };
    }
};
