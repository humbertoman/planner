import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, Clock, BookOpen, FileText, Plus, ChevronDown, ChevronRight, Settings, 
  Target, Users, Calendar as CalendarIcon, Edit3, Trash2, FolderPlus, Folder, Eye, 
  EyeOff, Save, X, Link, Search, Filter, BarChart3, CheckCircle, Circle, 
  AlertCircle, Info, LogOut
} from 'lucide-react';

// --- INÍCIO: NOVAS IMPORTAÇÕES DO FIREBASE ---
import { auth, db } from './firebase';
import { signOut } from 'firebase/auth';
import { 
    collection, query, where, onSnapshot, addDoc, doc, deleteDoc, updateDoc, serverTimestamp 
} from 'firebase/firestore';
// --- FIM: NOVAS IMPORTAÇÕES DO FIREBASE ---


// --- INÍCIO: SEUS COMPONENTES INTERNOS ORIGINAIS (MANTIDOS) ---
const ResourceAutocomplete = ({ value, onChange, resources, placeholder }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredResources, setFilteredResources] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (value.includes('@')) {
      const searchTerm = value.split('@').pop().toLowerCase();
      const filtered = resources.filter(resource => 
        resource.name.toLowerCase().includes(searchTerm)
      );
      setFilteredResources(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [value, resources]);

  const handleSelectResource = (resource) => {
    const beforeAt = value.substring(0, value.lastIndexOf('@'));
    const newValue = beforeAt + '@' + resource.name + ' ';
    onChange(newValue);
    setShowSuggestions(false);
    inputRef.current.focus();
  };

  return (
    <div className="relative">
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder + " (Digite @ para referenciar recursos)"}
        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        rows="4"
      />
      
      {showSuggestions && filteredResources.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
          {filteredResources.map((resource) => (
            <button
              key={resource.id}
              onClick={() => handleSelectResource(resource)}
              className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2"
            >
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
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) { days.push(null); }
    for (let day = 1; day <= daysInMonth; day++) { days.push(new Date(year, month, day)); }
    return days;
  };

  const isDateSelected = (date) => selectedDates.some(selected => selected.toDateString() === date.toDateString());

  const toggleDate = (date) => {
    const isSelected = isDateSelected(date);
    if (isSelected) {
      onChange(selectedDates.filter(selected => selected.toDateString() !== date.toDateString()));
    } else {
      onChange([...selectedDates, date]);
    }
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
          {days.map((day, index) => (
            <button key={index} onClick={() => day && toggleDate(day)} disabled={!day}
              className={`p-2 text-sm rounded hover:bg-blue-100 transition-colors ${!day ? 'invisible' : ''} ${day && isDateSelected(day) ? 'bg-blue-500 text-white hover:bg-blue-600' : ''} ${day && day < new Date().setHours(0,0,0,0) ? 'text-gray-400' : ''}`}>
              {day ? day.getDate() : ''}
            </button>
          ))}
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
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input value={editName} onChange={(e) => setEditName(e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-sm" autoFocus onKeyPress={(e) => e.key === 'Enter' && handleSave()} />
              <button onClick={handleSave} className="text-green-600 hover:text-green-800"><Save className="w-4 h-4" /></button>
              <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700"><X className="w-4 h-4" /></button>
            </div>
          ) : ( <span className="font-medium">{folder.name}</span> )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{componentsInFolder.length} componente{componentsInFolder.length !== 1 ? 's' : ''}</span>
          {!isEditing && (
            <>
              <button onClick={() => setIsEditing(true)} className="text-gray-500 hover:text-gray-