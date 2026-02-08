
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
    empId: string;
    fullName: string;
    role: 'Admin' | 'Employee' | 'IT Support';
    status: 'Active' | 'Inactive';
    email?: string;
}

interface AuthContextType {
    user: User | null;
    isAdmin: boolean;
    isEmployee: boolean;
    login: (userData: User) => void;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                localStorage.removeItem('currentUser');
            }
        }
        setLoading(false);
    }, []);

    const login = (userData: User) => {
        setUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('currentUser');
    };

    const isAdmin = user?.role === 'Admin';
    const isEmployee = user?.role === 'Employee';

    return (
        <AuthContext.Provider value={{ user, isAdmin, isEmployee, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
