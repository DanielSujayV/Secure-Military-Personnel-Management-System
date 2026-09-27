import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(
        () => localStorage.getItem("token")
    );

    const [username, setUsername] = useState(
        () => localStorage.getItem("username")
    );

    const login = (authToken, user) => {
        localStorage.setItem("token", authToken);
        localStorage.setItem("username", user);

        setToken(authToken);
        setUsername(user);
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("username");

        setToken(null);
        setUsername(null);
    };

    const isAuthenticated = !!token;

    return (
        <AuthContext.Provider
            value={{
                token,
                username,
                isAuthenticated,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);}