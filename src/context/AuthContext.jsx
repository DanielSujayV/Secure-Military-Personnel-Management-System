import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // Only a fully verified JWT belongs in the persistent token slot.
    const [token, setToken] = useState(() => localStorage.getItem("token"));
    const [username, setUsername] = useState(() => localStorage.getItem("username"));
    const [role, setRole] = useState(() => localStorage.getItem("role"));
    const [roleLoading, setRoleLoading] = useState(() => !!localStorage.getItem("token"));

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
                headers: { Authorization: `Bearer ${authToken}` },
            });
            if (!response.ok) {
                throw new Error(`Could not load role (${response.status})`);
            }

            const data = await response.json();
            if (!data.role) throw new Error("The server did not return a role.");

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

    // Password/TPM tokens are transient and never treated as a full session.
    const beginLogin = useCallback((preAuthToken, user) => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.setItem("username", user);
        sessionStorage.setItem("authStageToken", preAuthToken);
        sessionStorage.setItem("authStage", "password");
        setToken(null);
        setUsername(user);
        setRole(null);
        setRoleLoading(false);
    }, []);

    const setTpmVerifiedToken = useCallback((tpmToken, user) => {
        sessionStorage.setItem("authStageToken", tpmToken);
        sessionStorage.setItem("authStage", "tpm");
        if (user) {
            localStorage.setItem("username", user);
            setUsername(user);
        }
    }, []);

    const completeLogin = useCallback((finalToken, user) => {
        sessionStorage.removeItem("authStageToken");
        sessionStorage.removeItem("authStage");
        localStorage.setItem("token", finalToken);
        localStorage.setItem("username", user);
        localStorage.removeItem("role");
        setToken(finalToken);
        setUsername(user);
        setRole(null);
        setRoleLoading(true);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("role");
        sessionStorage.removeItem("authStageToken");
        sessionStorage.removeItem("authStage");
        sessionStorage.removeItem("tpmChallengeId");
        sessionStorage.removeItem("tpmDeviceId");
        sessionStorage.removeItem("tpmChallenge");
        setToken(null);
        setUsername(null);
        setRole(null);
        setRoleLoading(false);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                token,
                username,
                role,
                roleLoading,
                isAuthenticated: !!token,
                beginLogin,
                setTpmVerifiedToken,
                completeLogin,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
