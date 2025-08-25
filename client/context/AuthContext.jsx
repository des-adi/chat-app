import { createContext, useEffect, useState } from "react";
import axios from 'axios';
import toast from "react-hot-toast";
import { io } from 'socket.io-client';

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [authUser, setAuthUser] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState(null);
    const [socket, setSocket] = useState(null);

    // helper: clear invalid/expired token
    const handleInvalidToken = () => {
        localStorage.removeItem("token");
        setToken(null);
        setAuthUser(null);
        delete axios.defaults.headers.common["Authorization"];
    };

// check if the user is authenticated
const checkAuth = async () => {
    const token = localStorage.getItem("token");

    // 🚀 No token? Force login page directly
    if (!token) {
        handleInvalidToken();
        return;
    }

    try {
        const { data } = await axios.get("/api/auth/check", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (data.success) {
            setAuthUser(data.user);
            connectSocket(data.user);
        } else {
            handleInvalidToken();
        }
    } catch (error) {
        handleInvalidToken();
        toast.error(error.response?.data?.message || error.message);
    }
};


    // login
    const login = async (state, credentials) => {
        try {
            const { data } = await axios.post(`/api/auth/${state}`, credentials);
            if (data.success) {
                setAuthUser(data.userData);
                connectSocket(data.userData);
                axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
                setToken(data.token);
                localStorage.setItem("token", data.token);
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // logout
    const logout = async () => {
        localStorage.removeItem("token");
        setToken(null);
        setAuthUser(null);
        setOnlineUsers([]);
        delete axios.defaults.headers.common["Authorization"];
        toast.success("Logged out successfully");
        socket?.disconnect();
    };

    // update profile
    const updateProfile = async (body) => {
        try {
            const { data } = await axios.put("/api/auth/update-profile", body);
            if (data.success) {
                setAuthUser(data.user);
                toast.success("Profile updated successfully");
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // connect socket
    const connectSocket = (userData) => {
        if (!userData || socket?.connected) {
            return;
        }
        const newSocket = io(backendUrl, {
            query: { userId: userData._id },
        });
        newSocket.connect();
        setSocket(newSocket);
        newSocket.on("getOnlineUsers", (userIds) => {
            setOnlineUsers(userIds);
        });
    };

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }
        checkAuth();
    }, []);

    const value = {
        axios,
        authUser,
        onlineUsers,
        socket,
        login,
        logout,
        updateProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
