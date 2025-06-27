// Cole este código em: src/PaginaLogin.jsx
import React, { useState } from 'react';
import { auth } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

// (Cole aqui o código completo do PaginaLogin.jsx que eu te enviei na resposta anterior)
// É o componente grande que começa com 'function PaginaLogin() { ... }'

function PaginaLogin() {
  const [view, setView] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: '', message: '' }), 4000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      showAlert('error', 'Email ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showAlert('error', 'As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      showAlert('error', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      showAlert('success', 'Conta criada com sucesso! Faça o login para continuar.');
      setView('login');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        showAlert('error', 'Este email já está cadastrado.');
      } else {
        showAlert('error', 'Erro ao criar conta. Verifique o email.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      showAlert('error', 'Por favor, informe seu email.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      showAlert('success', 'Instruções de recuperação enviadas para seu email!');
    } catch (error) {
      showAlert('error', 'Email não encontrado em nossa base de dados.');
    } finally {
      setLoading(false);
    }
  };
  
  const FormButton = ({ text }) => (
      <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300 ease-in-out flex items-center justify-center gap-2 disabled:bg-blue-400"
      >
          {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <span>{text}</span>}
      </button>
  );

  return (
    <div className="gradient-bg min-h-screen flex items-center justify-center p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" style={{ animation: 'float 6s ease-in-out infinite' }}></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl" style={{ animation: 'float 6s ease-in-out infinite 2s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8" style={{ animation: 'fadeIn 0.8s ease-out' }}>
            <h1 className="text-4xl font-bold text-white mb-3">PlannerEdu</h1>
            <p className="text-blue-100 text-lg">Transforme seu planejamento pedagógico</p>
        </div>

        <div className="bg-white rounded-3xl p-8" style={{ boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)', animation: 'fadeIn 0.8s ease-out 0.2s' }}>
          {alert.message && (
             <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${alert.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                <span>{alert.message}</span>
            </div>
          )}

          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Bem-vindo de volta!</h2>
                  <p className="text-gray-600">Faça login para continuar planejando</p>
              </div>
              <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input type="email" id="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-4 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="seu@email.com" />
              </div>
              <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
                  <input type="password" id="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-4 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="Sua senha" />
              </div>
               <div className="flex items-center justify-end">
                  <button type="button" onClick={() => setView('forgot')} className="text-sm text-blue-600 hover:text-blue-800 font-medium">Esqueceu a senha?</button>
              </div>
              <FormButton text="Entrar" />
              <div className="text-center pt-6 border-t border-gray-100">
                  <span className="text-gray-600">Não tem uma conta? </span>
                  <button type="button" onClick={() => setView('register')} className="text-blue-600 hover:text-blue-800 font-semibold">Criar conta gratuita</button>
              </div>
            </form>
          )}

          {view === 'register' && (
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Criar Conta</h2>
                  <p className="text-gray-600">Junte-se a milhares de educadores</p>
              </div>
               <div>
                  <label htmlFor="registerName" className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                  <input type="text" id="registerName" required value={name} onChange={e => setName(e.target.value)} className="w-full pl-4 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="Seu nome" />
              </div>
              <div>
                  <label htmlFor="registerEmail" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input type="email" id="registerEmail" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-4 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="seu@email.com" />
              </div>
              <div>
                  <label htmlFor="registerPassword" className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
                  <input type="password" id="registerPassword" required value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-4 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="Mínimo 6 caracteres" />
              </div>
              <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">Confirmar Senha</label>
                  <input type="password" id="confirmPassword" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full pl-4 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="Confirme sua senha" />
              </div>
              <FormButton text="Criar Conta" />
              <div className="text-center pt-6 border-t border-gray-100">
                  <span className="text-gray-600">Já tem uma conta? </span>
                  <button type="button" onClick={() => setView('login')} className="text-blue-600 hover:text-blue-800 font-semibold">Fazer login</button>
              </div>
            </form>
          )}

          {view === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Recuperar Senha</h2>
                  <p className="text-gray-600">Informe seu email para receber o link</p>
              </div>
              <div>
                  <label htmlFor="forgotEmail" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input type="email" id="forgotEmail" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-4 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="seu@email.com" />
              </div>
              <FormButton text="Enviar Instruções" />
              <div className="text-center pt-6">
                  <button type="button" onClick={() => setView('login')} className="text-blue-600 hover:text-blue-800 font-semibold">← Voltar ao login</button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

export default PaginaLogin;