
import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(
        () => localStorage.getItem("token")
    );

    const [username, setUsername] = useState(
        () => localStorage.getItem("username")
    );

    const [role, setRole] = useState(
        () => localStorage.getItem("role")
    );

    const [roleLoading, setRoleLoading] = useState(!!localStorage.getItem("token"));

    const loadRole = useCallback(async (authToken) => {
        if (!authToken) {
            setRole(null);
            setRoleLoading(false);
            localStorage.removeItem("role");
            return;
        }

        setRoleLoading(true);

        try {
            const response = await fetch("http://localhost:8080/api/auth/me", {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Could not load role (${response.status})`);
            }

            const data = await response.json();

            if (!data.role) {
                throw new Error("The server did not return a role.");
            }

            localStorage.setItem("username", data.username);
            localStorage.setItem("role", data.role);

            setUsername(data.username);
            setRole(data.role);
        } catch (error) {
            console.error("Failed to load user role:", error);
            localStorage.removeItem("role");
            setRole(null);
        } finally {
            setRoleLoading(false);
        }
    }, []);

    useEffect(() => {
        loadRole(token);
    }, [token, loadRole]);

    const login = (authToken, user) => {
        localStorage.setItem("token", authToken);
        localStorage.setItem("username", user);

        setToken(authToken);
        setUsername(user);
        setRole(null);
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("role");

        setToken(null);
        setUsername(null);
        setRole(null);
        setRoleLoading(false);
    };

    const isAuthenticated = !!token;

    return (
        <AuthContext.Provider
            value={{
                token,
                username,
                role,
                roleLoading,
                isAuthenticated,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
