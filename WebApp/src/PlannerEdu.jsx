import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, Clock, BookOpen, FileText, Plus, ChevronDown, ChevronRight, Settings, 
  Target, Users, Calendar as CalendarIcon, Edit3, Trash2, FolderPlus, Folder, Eye, 
  EyeOff, Save, X, Link, Search, Filter, BarChart3, CheckCircle, Circle, 
  AlertCircle, Info, LogOut
} from 'lucide-react';

import { auth, db } from './firebase';
import { signOut } from 'firebase/auth';
import { 
    collection, query, where, onSnapshot, addDoc, doc, deleteDoc, updateDoc, serverTimestamp 
} from 'firebase/firestore';

const ResourceAutocomplete = ({ value, onChange, resources, placeholder }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredResources, setFilteredResources] = useState([]);
  const inputRef = useRef(null);
  useEffect(() => {
    if (value.includes('@')) {
      const searchTerm = value.split('@').pop().toLowerCase();
      const filtered = resources.filter(resource => resource.name.toLowerCase().includes(searchTerm));
      setFilteredResources(filtered); setShowSuggestions(true);
    } else { setShowSuggestions(false); }
  }, [value, resources]);
  const handleSelectResource = (resource) => {
    const beforeAt = value.substring(0, value.lastIndexOf('@'));
    const newValue = beforeAt + '@' + resource.name + ' ';
    onChange(newValue); setShowSuggestions(false); inputRef.current.focus();
  };
  return (
    <div className="relative">
      <textarea ref={inputRef} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder + " (Digite @ para referenciar recursos)"}
        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" rows="4" />
      {showSuggestions && filteredResources.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
          {filteredResources.map((resource) => (
            <button key={resource.id} onClick={() => handleSelectResource(resource)} className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2">
              <Link className="w-4 h-4 text-blue-500" />
              <span className="font-medium">{resource.name}</span>
              <span className="text-sm text-gray-500 ml-auto">{resource.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
const CalendarPicker = ({ selectedDates, onChange, isOpen, onClose }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const getDaysInMonth = (date) => {
    const year = date.getFullYear(); const month = date.getMonth();
    const firstDay = new Date(year, month, 1); const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate(); const startingDayOfWeek = firstDay.getDay();
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) { days.push(null); }
    for (let day = 1; day <= daysInMonth; day++) { days.push(new Date(year, month, day)); }
    return days;
  };
  const isDateSelected = (date) => selectedDates.some(selected => new Date(selected).toDateString() === date.toDateString());
  const toggleDate = (date) => {
    const isSelected = isDateSelected(date);
    if (isSelected) { onChange(selectedDates.filter(selected => new Date(selected).toDateString() !== date.toDateString())); } 
    else { onChange([...selectedDates, date.toISOString()]); }
  };
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  if (!isOpen) return null;
  const days = getDaysInMonth(currentMonth);
  const monthYear = currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Selecionar Dias de Aula</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded"><ChevronDown className="w-4 h-4 transform rotate-90" /></button>
          <h4 className="font-medium capitalize">{monthYear}</h4>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded"><ChevronDown className="w-4 h-4 transform -rotate-90" /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">{day}</div>)}
          {days.map((day, index) => (<button key={index} onClick={() => day && toggleDate(day)} disabled={!day} className={`p-2 text-sm rounded hover:bg-blue-100 transition-colors ${!day ? 'invisible' : ''} ${day && isDateSelected(day) ? 'bg-blue-500 text-white hover:bg-blue-600' : ''} ${day && day < new Date().setHours(0,0,0,0) ? 'text-gray-400' : ''}`}>{day ? day.getDate() : ''}</button>))}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">{selectedDates.length} dias selecionados</span>
          <button onClick={onClose} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Confirmar</button>
        </div>
      </div>
    </div>
  );
};
const FolderComponent = ({ folder, components, onRename, onDelete, children }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);
  const handleSave = () => { onRename(folder.id, editName); setIsEditing(false); };
  const handleCancel = () => { setEditName(folder.name); setIsEditing(false); };
  const componentsInFolder = components.filter(comp => comp.folderId === folder.id);
  return (
    <div className="border border-gray-200 rounded-lg mb-4">
      <div className="bg-gray-50 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsExpanded(!isExpanded)} className="text-gray-500 hover:text-gray-700">{isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</button>
          <Folder className="w-5 h-5 text-blue-500" />
          {isEditing ? (<div className="flex items-center gap-2"><input value={editName} onChange={(e) => setEditName(e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-sm" autoFocus onKeyPress={(e) => e.key === 'Enter' && handleSave()} /><button onClick={handleSave} className="text-green-600 hover:text-green-800"><Save className="w-4 h-4" /></button><button onClick={handleCancel} className="text-gray-500 hover:text-gray-700"><X className="w-4 h-4" /></button></div>) : ( <span className="font-medium">{folder.name}</span> )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{componentsInFolder.length} componente{componentsInFolder.length !== 1 ? 's' : ''}</span>
          {!isEditing && (<>
              <button onClick={() => setIsEditing(true)} className="text-gray-500 hover:text-gray-700 p-1"><Edit3 className="w-4 h-4" /></button>
              <button onClick={() => onDelete(folder.id)} className="text-red-500 hover:text-red-700 p-1" disabled={componentsInFolder.length > 0}><Trash2 className="w-4 h-4" /></button>
            </>
          )}
        </div>
      </div>
      {isExpanded && <div className="p-4">{children}</div>}
    </div>
  );
};

const PlannerEdu = ({ user }) => { 
  const [folders, setFolders] = useState([]); const [components, setComponents] = useState([]); const [lessons, setLessons] = useState([]); const [resources, setResources] = useState([]); const [evaluations, setEvaluations] = useState([]);
  const [activeTab, setActiveTab] = useState('components'); const [selectedComponent, setSelectedComponent] = useState(null); const [isCompactView, setIsCompactView] = useState(false); const [showCalendar, setShowCalendar] = useState(false); const [searchTerm, setSearchTerm] = useState(''); const [filterFolder, setFilterFolder] = useState('all');
  const [showComponentForm, setShowComponentForm] = useState(false); const [showLessonForm, setShowLessonForm] = useState(false); const [showResourceForm, setShowResourceForm] = useState(false); const [showEvaluationForm, setShowEvaluationForm] = useState(false); const [showFolderForm, setShowFolderForm] = useState(false);
  const [componentForm, setComponentForm] = useState({ name: '', description: '', workload: '', folderId: '', expectedResults: '', topics: '', dates: [] }); const [lessonForm, setLessonForm] = useState({ componentId: '', date: '', title: '', objectives: '', didacticSequence: '', resources: '', methodology: '', duration: '', evaluation: '', isNonPresential: false }); const [resourceForm, setResourceForm] = useState({ name: '', type: 'material', description: '', link: '' }); const [evaluationForm, setEvaluationForm] = useState({ componentId: '', name: '', type: 'prova', date: '', weight: '', description: '' }); const [folderForm, setFolderForm] = useState({ name: '', description: '' });

  useEffect(() => {
    if (!user) return;
    const createSubscription = (collectionName, setState) => {
      const q = query(collection(db, collectionName), where("userId", "==", user.uid));
      const unsubscribe = onSnapshot(q, (querySnapshot) => { const items = []; querySnapshot.forEach((doc) => { items.push({ id: doc.id, ...doc.data() }); }); setState(items); });
      return unsubscribe;
    };
    const unsubFolders = createSubscription('folders', setFolders); const unsubComponents = createSubscription('components', setComponents); const unsubLessons = createSubscription('lessons', setLessons); const unsubResources = createSubscription('resources', setResources); const unsubEvaluations = createSubscription('evaluations', setEvaluations);
    return () => { unsubFolders(); unsubComponents(); unsubLessons(); unsubResources(); unsubEvaluations(); };
  }, [user]);

  const handleLogout = () => signOut(auth);
  const resetComponentForm = () => setComponentForm({ name: '', description: '', workload: '', folderId: '', expectedResults: '', topics: '', dates: [] });
  const resetLessonForm = () => setLessonForm({ componentId: '', date: '', title: '', objectives: '', didacticSequence: '', resources: '', methodology: '', duration: '', evaluation: '', isNonPresential: false });
  const resetResourceForm = () => setResourceForm({ name: '', type: 'material', description: '', link: '' });
  const resetEvaluationForm = () => setEvaluationForm({ componentId: '', name: '', type: 'prova', date: '', weight: '', description: '' });
  const resetFolderForm = () => setFolderForm({ name: '', description: '' });
  const createFolder = async () => { if (folderForm.name.trim()) { await addDoc(collection(db, "folders"), { ...folderForm, createdAt: serverTimestamp(), userId: user.uid }); setShowFolderForm(false); resetFolderForm(); }};
  const renameFolder = async (folderId, newName) => { await updateDoc(doc(db, "folders", folderId), { name: newName }); };
  const deleteFolder = async (folderId) => { if (components.some(c => c.folderId === folderId)) { alert("Não é possível deletar pastas com componentes."); return; } await deleteDoc(doc(db, "folders", folderId)); };
  const createComponent = async () => { if (componentForm.name.trim()) { await addDoc(collection(db, "components"), { ...componentForm, workload: parseInt(componentForm.workload) || 0, createdAt: serverTimestamp(), userId: user.uid }); setShowComponentForm(false); resetComponentForm(); }};
  const deleteComponent = async (componentId) => { await deleteDoc(doc(db, "components", componentId)); };
  const createLesson = async () => { if (lessonForm.title.trim() && lessonForm.componentId) { await addDoc(collection(db, "lessons"), { ...lessonForm, duration: parseInt(lessonForm.duration) || 0, createdAt: serverTimestamp(), userId: user.uid }); setShowLessonForm(false); resetLessonForm(); }};
  const deleteLesson = async (lessonId) => await deleteDoc(doc(db, "lessons", lessonId));
  const createResource = async () => { if (resourceForm.name.trim()) { await addDoc(collection(db, "resources"), { ...resourceForm, createdAt: serverTimestamp(), userId: user.uid }); setShowResourceForm(false); resetResourceForm(); }};
  const deleteResource = async (resourceId) => await deleteDoc(doc(db, "resources", resourceId));
  const createEvaluation = async () => { if (evaluationForm.name.trim() && evaluationForm.componentId) { await addDoc(collection(db, "evaluations"), { ...evaluationForm, weight: parseFloat(evaluationForm.weight) || 0, createdAt: serverTimestamp(), userId: user.uid }); setShowEvaluationForm(false); resetEvaluationForm(); }};
  const deleteEvaluation = async (evaluationId) => await deleteDoc(doc(db, "evaluations", evaluationId));
  
  const getComponentProgress = (componentId) => {
    const component = components.find(comp => comp.id === componentId); if (!component) return { completed: 0, total: 0, percentage: 0 };
    const componentLessons = lessons.filter(lesson => lesson.componentId === componentId); const completedHours = componentLessons.reduce((total, lesson) => total + lesson.duration, 0);
    const totalHours = component.workload * 60; const percentage = totalHours > 0 ? (completedHours / totalHours) * 100 : 0;
    return { completed: completedHours, total: totalHours, percentage: Math.min(percentage, 100) };
  };
  const getFilteredComponents = () => {
    let filtered = components;
    if (searchTerm) { filtered = filtered.filter(comp => comp.name.toLowerCase().includes(searchTerm.toLowerCase()) || (comp.description && comp.description.toLowerCase().includes(searchTerm.toLowerCase()))); }
    if (filterFolder !== 'all' && filterFolder !== '') { filtered = filtered.filter(comp => comp.folderId === filterFolder); }
    if (filterFolder === '') { filtered = filtered.filter(comp => !comp.folderId); }
    return filtered;
  };
  const getComponentsByFolder = () => {
    const filtered = getFilteredComponents(); const foldersMap = new Map(); const noFolderComponents = [];
    filtered.forEach(component => {
      if (component.folderId) { if (!foldersMap.has(component.folderId)) { foldersMap.set(component.folderId, []); } foldersMap.get(component.folderId).push(component); } 
      else { noFolderComponents.push(component); }
    });
    return { foldersMap, noFolderComponents };
  };
  const renderComponentCard = (component) => {
    const progress = getComponentProgress(component.id); const componentLessons = lessons.filter(lesson => lesson.componentId === component.id); const componentEvaluations = evaluations.filter(evalItem => evalItem.componentId === component.id);
    return (
      <div key={component.id} onClick={() => setSelectedComponent(component)} className={`border border-gray-200 rounded-lg p-4 cursor-pointer transition-all ${selectedComponent?.id === component.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'} ${isCompactView ? 'mb-2' : 'mb-4'}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-blue-500" /><h3 className="font-semibold text-lg">{component.name}</h3>
              {component.dates && component.dates.length > 0 && <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">{component.dates.length} dias</span>}
            </div>
            {!isCompactView && (<> {component.description && <p className="text-gray-600 text-sm mb-3">{component.description}</p>}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                  <div className="text-center"><div className="text-sm text-gray-500">Carga Horária</div><div className="font-semibold text-blue-600">{component.workload}h</div></div>
                  <div className="text-center"><div className="text-sm text-gray-500">Aulas</div><div className="font-semibold text-green-600">{componentLessons.length}</div></div>
                  <div className="text-center"><div className="text-sm text-gray-500">Avaliações</div><div className="font-semibold text-orange-600">{componentEvaluations.length}</div></div>
                  <div className="text-center"><div className="text-sm text-gray-500">Progresso</div><div className="font-semibold text-purple-600">{progress.percentage.toFixed(1)}%</div></div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress.percentage}%` }}></div></div>
              </>)}
            {isCompactView && (<div className="flex items-center gap-4 text-sm text-gray-600"><span>{component.workload}h</span><span>{componentLessons.length} aulas</span><span>{progress.percentage.toFixed(1)}% concluído</span></div>)}
          </div>
          <div className="flex items-center gap-2 ml-4"><button onClick={(e) => { e.stopPropagation(); deleteComponent(component.id); }} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-4 h-4" /></button></div>
        </div>
      </div>
    );
  };
  const formatDate = (date) => date ? new Date(date).toLocaleDateString('pt-BR') : '';
  const formatTime = (minutes) => { const hours = Math.floor(minutes / 60); const mins = minutes % 60; return `${hours}h${mins.toString().padStart(2, '0')}min`; };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center"><BookOpen className="w-5 h-5 text-white" /></div><h1 className="text-2xl font-bold text-gray-900">PlannerEdu</h1></div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsCompactView(!isCompactView)} className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50">
              {isCompactView ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}<span className="text-sm">{isCompactView ? 'Detalhado' : 'Compacto'}</span>
            </button>
            <span className="text-sm text-gray-600 hidden sm:block">{user.email}</span>
            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-900 border border-gray-200 rounded-lg hover:bg-red-50">
              <LogOut className="w-4 h-4" /><span className="text-sm">Sair</span>
            </button>
          </div>
        </div>
      </header>
      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <nav className="p-4"><div className="space-y-2">
            {['components', 'lessons', 'resources', 'evaluations'].map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${activeTab === tab ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-700 hover:bg-gray-50'}`}>
                {tab === 'components' && <BookOpen className="w-5 h-5" />} {tab === 'lessons' && <FileText className="w-5 h-5" />} {tab === 'resources' && <Link className="w-5 h-5" />} {tab === 'evaluations' && <BarChart3 className="w-5 h-5" />}
                <span className="capitalize">{tab === 'components' ? 'Componentes' : (tab === 'lessons' ? 'Aulas' : (tab === 'resources' ? 'Recursos' : 'Avaliações'))}</span>
              </button>))}
          </div></nav>
          <div className="mt-auto p-4 border-t border-gray-200"><div className="bg-gray-50 rounded-lg p-3">
            <h4 className="font-medium text-gray-900 mb-2">Resumo</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Componentes:</span><span className="font-medium">{components.length}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Aulas:</span><span className="font-medium">{lessons.length}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Recursos:</span><span className="font-medium">{resources.length}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Avaliações:</span><span className="font-medium">{evaluations.length}</span></div>
            </div>
          </div></div>
        </div>
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {activeTab === 'components' && 'Componentes Curriculares'} {activeTab === 'lessons' && 'Planejamento de Aulas'}
                  {activeTab === 'resources' && 'Biblioteca de Recursos'} {activeTab === 'evaluations' && 'Sistema de Avaliações'}
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  {activeTab === 'components' && 'Gerencie seus componentes curriculares'} {activeTab === 'lessons' && 'Planeje suas aulas'}
                  {activeTab === 'resources' && 'Organize seus materiais'} {activeTab === 'evaluations' && 'Controle suas avaliações'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {activeTab === 'components' && (<><button onClick={() => setShowFolderForm(true)} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"><FolderPlus className="w-4 h-4" />Nova Pasta</button><button onClick={() => setShowComponentForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"><Plus className="w-4 h-4" />Novo Componente</button></>)}
                {activeTab === 'lessons' && (<button onClick={() => setShowLessonForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"><Plus className="w-4 h-4" />Nova Aula</button>)}
                {activeTab === 'resources' && (<button onClick={() => setShowResourceForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"><Plus className="w-4 h-4" />Novo Recurso</button>)}
                {activeTab === 'evaluations' && (<button onClick={() => setShowEvaluationForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"><Plus className="w-4 h-4" />Nova Avaliação</button>)}
              </div>
            </div>
            {activeTab === 'components' && (<div className="flex items-center gap-4 mt-4"><div className="flex-1 relative"><Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" /><input type="text" placeholder="Buscar componentes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"/></div><div className="flex items-center gap-2"><Filter className="w-4 h-4 text-gray-400" /><select value={filterFolder} onChange={(e) => setFilterFolder(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2"><option value="all">Todas as pastas</option>{folders.map(folder => (<option key={folder.id} value={folder.id}>{folder.name}</option>))} <option value="">Sem pasta</option></select></div></div>)}
          </div>
          <div className="flex-1 overflow-auto p-6">
            {/* O CONTEÚDO DAS ABAS VAI AQUI */}
          </div>
        </main>
      </div>

      {/* MODALS E FORMULÁRIOS COMPLETOS */}
      {showFolderForm && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4"><h3 className="text-lg font-semibold mb-4">Nova Pasta</h3><div className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Nome da Pasta</label><input type="text" value={folderForm.name} onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })} className="w-full p-3 border border-gray-200 rounded-lg" placeholder="Ex: Matemática Básica"/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label><textarea value={folderForm.description} onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })} className="w-full p-3 border border-gray-200 rounded-lg resize-none" rows="3" placeholder="Descreva o objetivo desta pasta..."/></div></div><div className="flex gap-3 mt-6"><button onClick={() => {setShowFolderForm(false); resetFolderForm();}} className="flex-1 px-4 py-2 border rounded-lg">Cancelar</button><button onClick={createFolder} className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg">Criar Pasta</button></div></div></div>)}
      {showComponentForm && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto"><h3 className="text-lg font-semibold mb-4">Novo Componente Curricular</h3><div className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium">Nome</label><input type="text" value={componentForm.name} onChange={(e) => setComponentForm({ ...componentForm, name: e.target.value })} className="w-full p-3 border rounded-lg" placeholder="Ex: Matemática Básica"/></div><div><label className="block text-sm font-medium">Carga Horária (h)</label><input type="number" value={componentForm.workload} onChange={(e) => setComponentForm({ ...componentForm, workload: e.target.value })} className="w-full p-3 border rounded-lg" placeholder="Ex: 60"/></div></div><div><label className="block text-sm font-medium">Pasta</label><select value={componentForm.folderId} onChange={(e) => setComponentForm({ ...componentForm, folderId: e.target.value })} className="w-full p-3 border rounded-lg"><option value="">Sem pasta</option>{folders.map(folder => (<option key={folder.id} value={folder.id}>{folder.name}</option>))}</select></div><div><label className="block text-sm font-medium">Descrição</label><textarea value={componentForm.description} onChange={(e) => setComponentForm({ ...componentForm, description: e.target.value })} className="w-full p-3 border rounded-lg" rows="3"/></div><div><label className="block text-sm font-medium">Dias de Aula</label><button onClick={() => setShowCalendar(true)} className="flex items-center gap-2 px-4 py-2 border rounded-lg"><Calendar className="w-4 h-4" />Selecionar Dias ({componentForm.dates.length})</button></div></div><div className="flex gap-3 mt-6"><button onClick={() => {setShowComponentForm(false); resetComponentForm();}} className="flex-1 px-4 py-2 border rounded-lg">Cancelar</button><button onClick={createComponent} className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg">Criar Componente</button></div></div></div>)}
      {showLessonForm && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-screen overflow-y-auto"><h3 className="text-lg font-semibold mb-4">Planejar Nova Aula</h3><div className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium">Componente</label><select value={lessonForm.componentId} onChange={(e) => setLessonForm({ ...lessonForm, componentId: e.target.value })} className="w-full p-3 border rounded-lg"><option value="">Selecione um componente</option>{components.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}</select></div><div><label className="block text-sm font-medium">Data</label><input type="date" value={lessonForm.date} onChange={(e) => setLessonForm({ ...lessonForm, date: e.target.value })} className="w-full p-3 border rounded-lg"/></div></div><div><label className="block text-sm font-medium">Título da Aula</label><input type="text" value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} className="w-full p-3 border rounded-lg"/></div><div><label className="block text-sm font-medium">Sequência Didática</label><ResourceAutocomplete value={lessonForm.didacticSequence} onChange={(value) => setLessonForm({ ...lessonForm, didacticSequence: value })} resources={resources} placeholder="Descreva a sequência..."/></div></div><div className="flex gap-3 mt-6"><button onClick={() => {setShowLessonForm(false); resetLessonForm();}} className="flex-1 px-4 py-2 border rounded-lg">Cancelar</button><button onClick={createLesson} className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg">Salvar Aula</button></div></div></div>)}
      {showResourceForm && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4"><h3 className="text-lg font-semibold mb-4">Novo Recurso</h3><div className="space-y-4"><div><label className="block text-sm font-medium">Nome</label><input type="text" value={resourceForm.name} onChange={(e) => setResourceForm({ ...resourceForm, name: e.target.value })} className="w-full p-3 border rounded-lg"/></div><div><label className="block text-sm font-medium">Tipo</label><select value={resourceForm.type} onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value })} className="w-full p-3 border rounded-lg"><option value="material">Material</option><option value="video">Vídeo</option><option value="link">Link</option></select></div></div><div className="flex gap-3 mt-6"><button onClick={() => {setShowResourceForm(false); resetResourceForm();}} className="flex-1 px-4 py-2 border rounded-lg">Cancelar</button><button onClick={createResource} className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg">Salvar Recurso</button></div></div></div>)}
      {showEvaluationForm && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4"><h3 className="text-lg font-semibold mb-4">Nova Avaliação</h3><div className="space-y-4"><div><label className="block text-sm font-medium">Componente</label><select value={evaluationForm.componentId} onChange={(e) => setEvaluationForm({ ...evaluationForm, componentId: e.target.value })} className="w-full p-3 border rounded-lg"><option value="">Selecione um componente</option>{components.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}</select></div><div><label className="block text-sm font-medium">Nome</label><input type="text" value={evaluationForm.name} onChange={(e) => setEvaluationForm({ ...evaluationForm, name: e.target.value })} className="w-full p-3 border rounded-lg"/></div></div><div className="flex gap-3 mt-6"><button onClick={() => {setShowEvaluationForm(false); resetEvaluationForm();}} className="flex-1 px-4 py-2 border rounded-lg">Cancelar</button><button onClick={createEvaluation} className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg">Salvar Avaliação</button></div></div></div>)}
      <CalendarPicker selectedDates={componentForm.dates} onChange={(dates) => setComponentForm({ ...componentForm, dates })} isOpen={showCalendar} onClose={() => setShowCalendar(false)}/>
    </div>
  );
};
export default PlannerEdu;