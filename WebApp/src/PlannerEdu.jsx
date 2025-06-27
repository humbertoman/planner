import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { signOut } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';

const PlannerEdu = () => {
  // Estados principais
  const [activeTab, setActiveTab] = useState('componentes');
  const [componentes, setComponentes] = useState([]);
  const [aulas, setAulas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para modais
  const [showComponenteModal, setShowComponenteModal] = useState(false);
  const [showAulaModal, setShowAulaModal] = useState(false);
  const [editingComponente, setEditingComponente] = useState(null);
  const [editingAula, setEditingAula] = useState(null);
  
  // Estados para formulários
  const [componenteForm, setComponenteForm] = useState({
    nome: '',
    descricao: '',
    duracao: '',
    categoria: 'abertura'
  });
  
  const [aulaForm, setAulaForm] = useState({
    titulo: '',
    data: '',
    duracao: '',
    componentes: []
  });

  const user = auth.currentUser;

  // Carregar dados do Firebase
  useEffect(() => {
    if (!user) return;

    const componentesQuery = query(
      collection(db, 'componentes'),
      where('userId', '==', user.uid),
      orderBy('nome')
    );

    const aulasQuery = query(
      collection(db, 'aulas'),
      where('userId', '==', user.uid),
      orderBy('data', 'desc')
    );

    const unsubscribeComponentes = onSnapshot(componentesQuery, (snapshot) => {
      const componentesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComponentes(componentesData);
    });

    const unsubscribeAulas = onSnapshot(aulasQuery, (snapshot) => {
      const aulasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAulas(aulasData);
      setLoading(false);
    });

    return () => {
      unsubscribeComponentes();
      unsubscribeAulas();
    };
  }, [user]);

  // Funções CRUD para Componentes
  const saveComponente = async (e) => {
    e.preventDefault();
    try {
      if (editingComponente) {
        await updateDoc(doc(db, 'componentes', editingComponente.id), componenteForm);
      } else {
        await addDoc(collection(db, 'componentes'), {
          ...componenteForm,
          userId: user.uid,
          createdAt: new Date()
        });
      }
      resetComponenteForm();
    } catch (error) {
      console.error('Erro ao salvar componente:', error);
      alert('Erro ao salvar componente. Tente novamente.');
    }
  };

  const deleteComponente = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este componente?')) {
      try {
        await deleteDoc(doc(db, 'componentes', id));
      } catch (error) {
        console.error('Erro ao excluir componente:', error);
        alert('Erro ao excluir componente. Tente novamente.');
      }
    }
  };

  const editComponente = (componente) => {
    setEditingComponente(componente);
    setComponenteForm({
      nome: componente.nome,
      descricao: componente.descricao,
      duracao: componente.duracao,
      categoria: componente.categoria
    });
    setShowComponenteModal(true);
  };

  const resetComponenteForm = () => {
    setComponenteForm({
      nome: '',
      descricao: '',
      duracao: '',
      categoria: 'abertura'
    });
    setEditingComponente(null);
    setShowComponenteModal(false);
  };

  // Funções CRUD para Aulas
  const saveAula = async (e) => {
    e.preventDefault();
    try {
      const aulaData = {
        ...aulaForm,
        userId: user.uid,
        createdAt: new Date()
      };

      if (editingAula) {
        await updateDoc(doc(db, 'aulas', editingAula.id), aulaData);
      } else {
        await addDoc(collection(db, 'aulas'), aulaData);
      }
      resetAulaForm();
    } catch (error) {
      console.error('Erro ao salvar aula:', error);
      alert('Erro ao salvar aula. Tente novamente.');
    }
  };

  const deleteAula = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta aula?')) {
      try {
        await deleteDoc(doc(db, 'aulas', id));
      } catch (error) {
        console.error('Erro ao excluir aula:', error);
        alert('Erro ao excluir aula. Tente novamente.');
      }
    }
  };

  const editAula = (aula) => {
    setEditingAula(aula);
    setAulaForm({
      titulo: aula.titulo,
      data: aula.data,
      duracao: aula.duracao,
      componentes: aula.componentes || []
    });
    setShowAulaModal(true);
  };

  const resetAulaForm = () => {
    setAulaForm({
      titulo: '',
      data: '',
      duracao: '',
      componentes: []
    });
    setEditingAula(null);
    setShowAulaModal(false);
  };

  // Função de logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // Função para adicionar/remover componentes da aula
  const toggleComponenteInAula = (componenteId) => {
    setAulaForm(prev => ({
      ...prev,
      componentes: prev.componentes.includes(componenteId)
        ? prev.componentes.filter(id => id !== componenteId)
        : [...prev.componentes, componenteId]
    }));
  };

  // Calcular duração total da aula
  const calcularDuracaoTotal = (componentesIds) => {
    return componentesIds.reduce((total, id) => {
      const componente = componentes.find(c => c.id === id);
      return total + (parseInt(componente?.duracao) || 0);
    }, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">PlannerEdu</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Olá, {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('componentes')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'componentes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Componentes
            </button>
            <button
              onClick={() => setActiveTab('aulas')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'aulas'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Aulas
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab: Componentes */}
        {activeTab === 'componentes' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Componentes de Aula
              </h2>
              <button
                onClick={() => setShowComponenteModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Novo Componente
              </button>
            </div>

            {componentes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  Nenhum componente criado ainda. Crie seu primeiro componente!
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {componentes.map((componente) => (
                  <div
                    key={componente.id}
                    className="bg-white rounded-lg shadow-sm border p-6"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {componente.nome}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        componente.categoria === 'abertura' ? 'bg-green-100 text-green-800' :
                        componente.categoria === 'desenvolvimento' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {componente.categoria}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{componente.descricao}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        {componente.duracao} min
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => editComponente(componente)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => deleteComponente(componente.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Aulas */}
        {activeTab === 'aulas' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Aulas Planejadas
              </h2>
              <button
                onClick={() => setShowAulaModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Nova Aula
              </button>
            </div>

            {aulas.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  Nenhuma aula planejada ainda. Crie sua primeira aula!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {aulas.map((aula) => (
                  <div
                    key={aula.id}
                    className="bg-white rounded-lg shadow-sm border p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {aula.titulo}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {new Date(aula.data).toLocaleDateString('pt-BR')} • {aula.duracao} min
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => editAula(aula)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => deleteAula(aula.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                    
                    {aula.componentes && aula.componentes.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Componentes:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {aula.componentes.map((componenteId) => {
                            const componente = componentes.find(c => c.id === componenteId);
                            return componente ? (
                              <span
                                key={componenteId}
                                className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded"
                              >
                                {componente.nome} ({componente.duracao}min)
                              </span>
                            ) : null;
                          })}
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          Duração total: {calcularDuracaoTotal(aula.componentes)} minutos
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal: Componente */}
      {showComponenteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingComponente ? 'Editar Componente' : 'Novo Componente'}
            </h3>
            <form onSubmit={saveComponente}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nome
                  </label>
                  <input
                    type="text"
                    required
                    value={componenteForm.nome}
                    onChange={(e) => setComponenteForm({...componenteForm, nome: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Descrição
                  </label>
                  <textarea
                    required
                    value={componenteForm.descricao}
                    onChange={(e) => setComponenteForm({...componenteForm, descricao: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Duração (minutos)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={componenteForm.duracao}
                    onChange={(e) => setComponenteForm({...componenteForm, duracao: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Categoria
                  </label>
                  <select
                    value={componenteForm.categoria}
                    onChange={(e) => setComponenteForm({...componenteForm, categoria: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="abertura">Abertura</option>
                    <option value="desenvolvimento">Desenvolvimento</option>
                    <option value="fechamento">Fechamento</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={resetComponenteForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  {editingComponente ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Aula */}
      {showAulaModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingAula ? 'Editar Aula' : 'Nova Aula'}
            </h3>
            <form onSubmit={saveAula}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Título
                  </label>
                  <input
                    type="text"
                    required
                    value={aulaForm.titulo}
                    onChange={(e) => setAulaForm({...aulaForm, titulo: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Data
                  </label>
                  <input
                    type="date"
                    required
                    value={aulaForm.data}
                    onChange={(e) => setAulaForm({...aulaForm, data: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Duração Total (minutos)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={aulaForm.duracao}
                    onChange={(e) => setAulaForm({...aulaForm, duracao: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                {componentes.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Componentes da Aula
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                      {componentes.map((componente) => (
                        <label key={componente.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={aulaForm.componentes.includes(componente.id)}
                            onChange={() => toggleComponenteInAula(componente.id)}
                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            {componente.nome} ({componente.duracao}min)
                          </span>
                        </label>
                      ))}
                    </div>
                    {aulaForm.componentes.length > 0 && (
                      <p className="text-sm text-gray-500 mt-2">
                        Duração dos componentes selecionados: {calcularDuracaoTotal(aulaForm.componentes)} minutos
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={resetAulaForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  {editingAula ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlannerEdu;