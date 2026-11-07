import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Users, UserPlus, LayoutDashboard, Search, Filter, 
  Download, Edit2, Trash2, Shield, Camera, 
  Phone, Mail, MapPin, CheckCircle2, XCircle
} from 'lucide-react';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://votre-projet.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "votre-cle-anon";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const API_LOCAL_URL = "http://localhost:5000/api/membres";

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [membres, setMembres] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartement, setFilterDepartement] = useState('Tous');
  const [editingMember, setEditingMember] = useState(null);
  const [useSupabase, setUseSupabase] = useState(false);

  const [formData, setFormData] = useState({
    nom: '', prenom: '', genre: 'Homme', dateNaissance: '',
    telephone: '', email: '', adresse: '', etatCivil: 'Célibataire',
    nomConjoint: '', nombreEnfants: 0, dateBapteme: '',
    estBaptise: true, departement: 'Membre simple', photoUrl: ''
  });

  const chargerMembres = async () => {
    if (useSupabase) {
      try {
        const { data, error } = await supabase.from('membres').select('*');
        if (!error && data) setMembres(data);
      } catch (err) {
        console.error("Erreur Supabase:", err);
      }
    } else {
      try {
        const res = await fetch(API_LOCAL_URL);
        if (res.ok) {
          const data = await res.json();
          setMembres(data);
        }
      } catch (err) {
        console.log("Serveur backend local non connecté.");
      }
    }
  };

  useEffect(() => {
    chargerMembres();
  }, [useSupabase]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (useSupabase) {
      if (editingMember) {
        await supabase.from('membres').update(formData).eq('id', editingMember.id);
      } else {
        await supabase.from('membres').insert([{ id: Date.now().toString(), ...formData }]);
      }
    } else {
      if (editingMember) {
        try {
          await fetch(`${API_LOCAL_URL}/${editingMember.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
          });
        } catch (err) {
          setMembres(membres.map(m => m.id === editingMember.id ? { ...formData, id: editingMember.id } : m));
        }
      } else {
        try {
          await fetch(API_LOCAL_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
          });
        } catch (err) {
          setMembres([...membres, { ...formData, id: Date.now().toString() }]);
        }
      }
    }
    resetForm();
    chargerMembres();
    setActiveTab('members');
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setFormData(member);
    setActiveTab('register');
  };

  const handleDelete = async (id) => {
    if (window.confirm("Voulez-vous vraiment supprimer ce membre ?")) {
      if (useSupabase) {
        await supabase.from('membres').delete().eq('id', id);
      } else {
        try {
          await fetch(`${API_LOCAL_URL}/${id}`, { method: 'DELETE' });
        } catch (err) {
          setMembres(membres.filter(m => m.id !== id));
        }
      }
      chargerMembres();
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '', prenom: '', genre: 'Homme', dateNaissance: '',
      telephone: '', email: '', adresse: '', etatCivil: 'Célibataire',
      nomConjoint: '', nombreEnfants: 0, dateBapteme: '',
      estBaptise: true, departement: 'Membre simple', photoUrl: ''
    });
    setEditingMember(null);
  };

  const exportCSV = () => {
    const headers = ["ID,Nom,Prénom,Genre,Téléphone,Email,Département,Baptisé\n"];
    const rows = membres.map(m => `${m.id},"${m.nom}","${m.prenom}",${m.genre},"${m.telephone}","${m.email}","${m.departement}",${m.estBaptise ? 'Oui' : 'Non'}`);
    const blob = new Blob([headers + rows.join("\n")], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Recensement_CEC_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const membresFiltres = membres.filter(m => {
    const matchSearch = `${m.nom || ''} ${m.prenom || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (m.telephone && m.telephone.includes(searchTerm));
    const matchDept = filterDepartement === 'Tous' || m.departement === filterDepartement;
    return matchSearch && matchDept;
  });

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      <aside className="w-64 bg-indigo-900 text-white flex flex-col justify-between p-4 shadow-xl">
        <div>
          <div className="flex items-center gap-3 px-2 py-4 border-b border-indigo-800 mb-6">
            <div className="bg-amber-400 p-2 rounded-lg text-indigo-950 font-bold">CEC</div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Communauté CEC</h1>
              <p className="text-xs text-indigo-300">Recensement des membres</p>
            </div>
          </div>

          <nav className="space-y-2">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === 'dashboard' ? 'bg-indigo-700 text-white' : 'text-indigo-200 hover:bg-indigo-800'}`}
            >
              <LayoutDashboard size={18} /> Tableau de Bord
            </button>
            <button 
              onClick={() => setActiveTab('members')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === 'members' ? 'bg-indigo-700 text-white' : 'text-indigo-200 hover:bg-indigo-800'}`}
            >
              <Users size={18} /> Liste des Membres
            </button>
            <button 
              onClick={() => { resetForm(); setActiveTab('register'); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === 'register' ? 'bg-indigo-700 text-white' : 'text-indigo-200 hover:bg-indigo-800'}`}
            >
              <UserPlus size={18} /> Nouveau Recensement
            </button>
          </nav>
        </div>

        <div className="space-y-3">
          <div className="bg-indigo-950/60 p-3 rounded-xl border border-indigo-800/50 flex items-center justify-between">
            <span className="text-xs text-indigo-200">Mode Cloud Supabase</span>
            <input 
              type="checkbox" 
              checked={useSupabase} 
              onChange={(e) => setUseSupabase(e.target.checked)}
              className="w-4 h-4 text-amber-400 rounded cursor-pointer" 
            />
          </div>

          <div className="bg-indigo-950/60 p-3 rounded-xl border border-indigo-800/50 flex items-center gap-3">
            <Shield className="text-amber-400" size={20} />
            <div>
              <p className="text-xs font-semibold text-white">Administrateur</p>
              <p className="text-[10px] text-indigo-300">Accès complet à la base</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Tableau de Bord - Communauté CEC</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Membres</p>
                  <p className="text-3xl font-extrabold text-slate-900 mt-1">{membres.length}</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-xl text-indigo-600"><Users size={28} /></div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Membres Baptisés</p>
                  <p className="text-3xl font-extrabold text-emerald-600 mt-1">{membres.filter(m => m.estBaptise).length}</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl text-emerald-600"><CheckCircle2 size={28} /></div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Non Baptisés</p>
                  <p className="text-3xl font-extrabold text-amber-600 mt-1">{membres.filter(m => !m.estBaptise).length}</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl text-amber-600"><XCircle size={28} /></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-bold text-slate-800">Annuaire des Membres</h2>
              <button onClick={exportCSV} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition">
                <Download size={16} /> Exporter Excel (CSV)
              </button>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Rechercher par nom ou téléphone..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter size={18} className="text-slate-400" />
                <select 
                  value={filterDepartement}
                  onChange={(e) => setFilterDepartement(e.target.value)}
                  className="py-2 px-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  <option value="Tous">Tous les départements</option>
                  <option value="Chorale">Chorale</option>
                  <option value="Protocole">Protocole</option>
                  <option value="Jeunesse">Jeunesse</option>
                  <option value="Intercession">Intercession</option>
                  <option value="Membre simple">Membre simple</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {membresFiltres.map((m) => (
                <div key={m.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative group flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      {m.photoUrl ? (
                        <img src={m.photoUrl} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl font-bold border-2 border-indigo-200">
                          {m.nom?.[0]}{m.prenom?.[0]}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">{m.prenom} {m.nom}</h3>
                        <span className="inline-block bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-medium mt-1">
                          {m.departement}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-slate-600 mb-4">
                      {m.telephone && <p className="flex items-center gap-2"><Phone size={14} /> {m.telephone}</p>}
                      {m.email && <p className="flex items-center gap-2"><Mail size={14} /> {m.email}</p>}
                      {m.adresse && <p className="flex items-center gap-2"><MapPin size={14} /> {m.adresse}</p>}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className={`text-xs px-2 py-0.5 rounded ${m.estBaptise ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                      {m.estBaptise ? 'Baptisé(e)' : 'Non Baptisé(e)'}
                    </span>

                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(m)} className="p-2 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-50"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(m.id)} className="p-2 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-50"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'register' && (
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">
              {editingMember ? 'Modifier la Fiche Membre' : 'Nouveau Recensement - Communauté CEC'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                {formData.photoUrl ? (
                  <img src={formData.photoUrl} alt="Aperçu" className="w-24 h-24 rounded-full object-cover mb-2 border-2 border-indigo-500" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 mb-2"><Camera size={32} /></div>
                )}
                <label className="cursor-pointer bg-white px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 shadow-sm">
                  Choisir une photo
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
                  <input type="text" name="nom" required value={formData.nom} onChange={handleChange} className="w-full p-2.5 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prénom *</label>
                  <input type="text" name="prenom" required value={formData.prenom} onChange={handleChange} className="w-full p-2.5 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Genre</label>
                  <select name="genre" value={formData.genre} onChange={handleChange} className="w-full p-2.5 border rounded-xl">
                    <option value="Homme">Homme</option>
                    <option value="Femme">Femme</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date de naissance</label>
                  <input type="date" name="dateNaissance" value={formData.dateNaissance} onChange={handleChange} className="w-full p-2.5 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                  <input type="tel" name="telephone" value={formData.telephone} onChange={handleChange} className="w-full p-2.5 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2.5 border rounded-xl" />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Département / Ministère</label>
                  <select name="departement" value={formData.departement} onChange={handleChange} className="w-full p-2.5 border rounded-xl">
                    <option value="Membre simple">Membre simple</option>
                    <option value="Chorale">Chorale</option>
                    <option value="Protocole">Protocole</option>
                    <option value="Jeunesse">Jeunesse</option>
                    <option value="Intercession">Intercession</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <input type="checkbox" id="estBaptise" name="estBaptise" checked={formData.estBaptise} onChange={handleChange} className="w-5 h-5 text-indigo-600 rounded" />
                  <label htmlFor="estBaptise" className="text-sm font-medium text-slate-700">Membre Baptisé(e)</label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setActiveTab('members')} className="px-5 py-2.5 border rounded-xl text-sm font-semibold text-slate-600">Annuler</button>
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm">
                  {editingMember ? 'Mettre à jour' : 'Enregistrer le membre'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
