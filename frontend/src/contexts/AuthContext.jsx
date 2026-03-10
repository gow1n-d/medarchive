import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(api.getUser());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (api.isAuthenticated()) {
            api.getMe()
                .then(userData => {
                    setUser(userData);
                    api.setUser(userData);
                })
                .catch(() => {
                    api.clearToken();
                    setUser(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const data = await api.login(email, password);
        setUser(data.user);
        return data;
    };

    const register = async (userData) => {
        const data = await api.register(userData);
        setUser(data.user);
        return data;
    };

    const logout = () => {
        api.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
