import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi, setUnauthorizedHandler, tokenStore } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  const logout = useCallback(async () => {
    await tokenStore.clear();
    setUsuario(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    (async () => {
      try {
        if (await tokenStore.get()) setUsuario((await authApi.me()).usuario);
      } catch {
        await tokenStore.clear();
      } finally {
        setCargando(false);
      }
    })();
  }, [logout]);

  const iniciar = async (r) => {
    await tokenStore.set(r.token);
    setUsuario(r.usuario);
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        cargando,
        logout,
        login: async (d) => iniciar(await authApi.login(d)),
        register: async (d) => iniciar(await authApi.register(d)),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
