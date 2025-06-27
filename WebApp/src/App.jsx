// Cole este código em: src/App.jsx
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import PlannerEdu from './PlannerEdu'; // Renomeei para ficar mais limpo
import PaginaLogin from './PaginaLogin';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Esta função do Firebase "escuta" as mudanças de login/logout
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Limpa a escuta quando o componente é fechado para evitar vazamento de memória
    return () => unsubscribe();
  }, []);

  // Enquanto verifica o usuário, mostra uma tela de carregamento
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        Carregando PlannerEdu...
      </div>
    );
  }

  // Se não houver usuário logado, mostra a PáginaLogin.
  // Se houver, mostra o PlannerEdu, passando os dados do usuário para ele.
  return user ? <PlannerEdu user={user} /> : <PaginaLogin />;
}

export default App;