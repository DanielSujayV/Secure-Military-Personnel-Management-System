import { API_BASE_URL } from "../services/api";
import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
    useRef,
} from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem("token"));
    const [username, setUsername] = useState(() => localStorage.getItem("username"));
    const [role, setRole] = useState(null);
    const [roleLoading, setRoleLoading] = useState(() => Boolean(localStorage.getItem("token")));
    const requestSequence = useRef(0);

    const loadRole = useCallback(async (authToken) => {
        const requestId = ++requestSequence.current;
        if (!authToken) {
            setUsername(null);
            setRole(null);
            setRoleLoading(false);
            return;
        }

        setRoleLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (!response.ok) {
                throw new Error(`Session is not fully authenticated (HTTP ${response.status}).`);
            }

            const data = await response.json();
            if (requestId !== requestSequence.current) return null;
            if (!data?.username || !data?.role) {
                throw new Error("The server returned an incomplete user profile.");
            }

            const normalizedRole = String(data.role).toUpperCase();
            localStorage.setItem("username", data.username);
            localStorage.setItem("role", normalizedRole);
            setUsername(data.username);
            setRole(normalizedRole);
            return data;
        } catch (error) {
            // Ignore stale responses from earlier authentication stages.
            if (requestId === requestSequence.current) {
                localStorage.removeItem("role");
                setRole(null);
                console.warn("User profile is not available yet:", error.message);
            }
            return null;
        } finally {
            if (requestId === requestSequence.current) {
                setRoleLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        loadRole(token);
    }, [token, loadRole]);

    const login = useCallback((authToken, user) => {
        requestSequence.current += 1;
        localStorage.setItem("token", authToken);
        if (user) localStorage.setItem("username", user);
        localStorage.removeItem("role");
        setToken(authToken);
        setUsername(user || null);
        setRole(null);
    }, []);

    // All authentication stages must replace tokens through this method so
    // React state and localStorage cannot drift out of sync.
    const replaceToken = useCallback((authToken, user) => {
        if (!authToken) throw new Error("A valid authentication token is required.");
        requestSequence.current += 1;
        localStorage.setItem("token", authToken);
        if (user) localStorage.setItem("username", user);
        setToken(authToken);
        if (user) setUsername(user);
        setRole(null);
    }, []);

    const refreshUser = useCallback((authToken = token) => loadRole(authToken), [loadRole, token]);

    const logout = useCallback(() => {
        requestSequence.current += 1;
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("role");
        sessionStorage.removeItem("tpmChallengeId");
        sessionStorage.removeItem("tpmDeviceId");
        sessionStorage.removeItem("tpmChallenge");
        setToken(null);
        setUsername(null);
        setRole(null);
        setRoleLoading(false);
    }, []);

    const value = useMemo(() => ({
        token,
        username,
        role,
        roleLoading,
        isAuthenticated: Boolean(token && role),
        login,
        replaceToken,
        refreshUser,
        logout,
    }), [token, username, role, roleLoading, login, replaceToken, refreshUser, logout]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);