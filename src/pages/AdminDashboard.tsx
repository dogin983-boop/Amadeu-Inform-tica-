import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { UserProfile, Appointment, Product, GameReservation, Category, AppointmentStatus, UserRole } from '../types';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { toast } from 'sonner';
import { 
  LayoutDashboard, 
  Wrench, 
  ShoppingCart, 
  Users, 
  Gamepad2, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  Clock, 
  Search,
  ChevronRight,
  Filter,
  Image as ImageIcon,
  DollarSign,
  Tag,
  Save,
  X,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- Sub-components ---

function AppointmentsManager() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AppointmentStatus | 'Todos'>('Todos');

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'appointments'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      setAppointments(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const updateStatus = async (id: string, newStatus: AppointmentStatus) => {
    try {
      await updateDoc(doc(db, 'appointments', id), { status: newStatus });
      toast.success(`Status atualizado para: ${newStatus}`);
      fetchAppointments();
    } catch (error) {
      toast.error('Erro ao atualizar status.');
    }
  };

  const filtered = filter === 'Todos' ? appointments : appointments.filter(a => a.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
          <Wrench className="w-6 h-6 text-royal-blue" />
          <span>Ordens de Serviço</span>
        </h2>
        <div className="flex space-x-2">
          {['Todos', 'Em análise', 'Pendente', 'Pronto'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${filter === f ? 'bg-royal-blue text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-400 text-xs uppercase font-bold">
              <tr>
                <th className="px-6 py-4">Código</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Equipamento</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Nenhuma ordem encontrada.</td></tr>
              ) : filtered.map(a => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-royal-blue">{a.trackingCode}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-800">{a.customerName}</p>
                    <p className="text-xs text-gray-400">{a.phone}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{a.equipment}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      a.status === 'Em análise' ? 'bg-blue-100 text-blue-700' :
                      a.status === 'Pendente' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <select 
                        className="text-xs border rounded p-1"
                        value={a.status}
                        onChange={(e) => updateStatus(a.id!, e.target.value as AppointmentStatus)}
                      >
                        <option value="Em análise">Em análise</option>
                        <option value="Pendente">Pendente</option>
                        <option value="Pronto">Pronto</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'products'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success('Item excluído!');
      fetchProducts();
    } catch (error) {
      toast.error('Erro ao excluir.');
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: parseFloat(formData.get('price') as string),
      category: formData.get('category') as Category,
      imageUrl: formData.get('imageUrl') as string,
      active: formData.get('active') === 'on'
    };

    try {
      if (editingProduct?.id) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
        toast.success('Produto atualizado!');
      } else {
        await addDoc(collection(db, 'products'), productData);
        toast.success('Produto criado!');
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      toast.error('Erro ao salvar.');
    }
  };

  const seedData = async () => {
    const products = [
      { name: 'Impressão Colorida A4', description: 'Papel sulfite 75g, alta qualidade.', price: 2.50, category: 'Papelaria', active: true, imageUrl: 'https://picsum.photos/seed/print/400/300' },
      { name: 'Plastificação de Documentos', description: 'Proteção duradoura para seus documentos.', price: 5.00, category: 'Papelaria', active: true, imageUrl: 'https://picsum.photos/seed/plastic/400/300' },
      { name: 'Manutenção Preventiva PC', description: 'Limpeza e troca de pasta térmica.', price: 120.00, category: 'Tech', active: true, imageUrl: 'https://picsum.photos/seed/pc/400/300' },
      { name: 'Topo de Bolo Personalizado', description: 'Temas diversos para sua festa.', price: 25.00, category: 'Topos de Bolo', active: true, imageUrl: 'https://picsum.photos/seed/cake/400/300' },
      { name: '1 Hora Lan House', description: 'Acesso a PCs Gamer de última geração.', price: 10.00, category: 'Lan House', active: true, imageUrl: 'https://picsum.photos/seed/game/400/300' },
    ];

    try {
      for (const p of products) {
        await addDoc(collection(db, 'products'), p);
      }
      toast.success('Dados iniciais carregados!');
      fetchProducts();
    } catch (error) {
      toast.error('Erro ao carregar dados.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
          <ShoppingCart className="w-6 h-6 text-royal-blue" />
          <span>Gestão da Vitrine</span>
        </h2>
        <div className="flex space-x-2">
          <button onClick={seedData} className="btn-secondary text-xs py-1 px-3">Carregar Iniciais</button>
          <button 
            onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Item</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-center col-span-full text-gray-400">Carregando...</p>
        ) : products.map(p => (
          <div key={p.id} className="card p-4 flex space-x-4">
            <img src={p.imageUrl || `https://picsum.photos/seed/${p.name}/100/100`} className="w-20 h-20 rounded-lg object-cover" alt={p.name} />
            <div className="flex-grow">
              <h3 className="font-bold text-gray-800">{p.name}</h3>
              <p className="text-xs text-gray-400">{p.category}</p>
              <p className="text-royal-blue font-bold">R$ {p.price.toFixed(2)}</p>
              <div className="flex space-x-2 mt-2">
                <button onClick={() => { setEditingProduct(p); setIsModalOpen(true); }} className="text-blue-500 hover:text-blue-700"><Edit className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(p.id!)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="bg-royal-blue p-4 text-white flex justify-between items-center">
                <h3 className="font-bold">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
                <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Nome</label>
                    <input name="name" defaultValue={editingProduct?.name} required className="w-full border rounded-lg p-2" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Preço</label>
                    <input name="price" type="number" step="0.01" defaultValue={editingProduct?.price} required className="w-full border rounded-lg p-2" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Categoria</label>
                    <select name="category" defaultValue={editingProduct?.category} className="w-full border rounded-lg p-2">
                      {["Lan House", "Papelaria", "Tech", "Fotografia", "Topos de Bolo", "Manutenção"].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">URL da Imagem</label>
                    <input name="imageUrl" defaultValue={editingProduct?.imageUrl} className="w-full border rounded-lg p-2" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Descrição</label>
                    <textarea name="description" defaultValue={editingProduct?.description} className="w-full border rounded-lg p-2 resize-none" rows={3} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input name="active" type="checkbox" defaultChecked={editingProduct ? editingProduct.active : true} />
                    <label className="text-sm font-bold text-gray-700">Ativo na Vitrine</label>
                  </div>
                </div>
                <button type="submit" className="btn-primary w-full flex items-center justify-center space-x-2">
                  <Save className="w-4 h-4" />
                  <span>Salvar</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TeamManager({ userProfile }: { userProfile: UserProfile | null }) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ ...doc.data() } as UserProfile));
      // Sort by last login or name
      setUsers(data.sort((a, b) => {
        if (a.lastLogin && b.lastLogin) return new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime();
        return a.name.localeCompare(b.name);
      }));
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error('Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateRole = async (uid: string, newRole: UserRole) => {
    if (userProfile?.role !== 'super' && userProfile?.role !== 'admin') {
      toast.error('Sem permissão.');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      toast.success('Cargo atualizado!');
      fetchUsers();
    } catch (error) {
      toast.error('Erro ao atualizar cargo.');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (userProfile?.role !== 'super' && userProfile?.role !== 'admin') {
    return <div className="p-12 text-center text-gray-400">Apenas administradores podem gerenciar a equipe.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
          <Users className="w-6 h-6 text-royal-blue" />
          <span>Gestão de Usuários</span>
        </h2>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou email..." 
            className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-royal-blue outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-400 text-xs uppercase font-bold">
              <tr>
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4">Último Acesso</th>
                <th className="px-6 py-4">Cargo Atual</th>
                <th className="px-6 py-4">Alterar Cargo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">Carregando...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">Nenhum usuário encontrado.</td></tr>
              ) : filteredUsers.map(u => (
                <tr key={u.uid} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-800">{u.name}</span>
                      <span className="text-xs text-gray-400">{u.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {u.lastLogin ? format(new Date(u.lastLogin), "dd/MM/yy 'às' HH:mm", { locale: ptBR }) : 'Nunca'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      u.role === 'super' ? 'bg-red-100 text-red-700' :
                      u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      u.role === 'staff' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {u.role === 'super' ? 'Super Admin' : u.role === 'admin' ? 'Admin' : u.role === 'staff' ? 'Staff' : 'Cliente'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {/* Only super admin can change roles of others, and cannot change their own role to something else if it's the main super admin */}
                    <select 
                      className="text-xs border rounded-lg p-2 bg-white focus:ring-2 focus:ring-royal-blue outline-none disabled:opacity-50"
                      value={u.role}
                      onChange={(e) => updateRole(u.uid, e.target.value as UserRole)}
                      disabled={
                        (userProfile?.role !== 'super' && userProfile?.role !== 'admin') || 
                        (u.email === 'dogin983@gmail.com') ||
                        (u.uid === userProfile?.uid)
                      }
                    >
                      <option value="client">Cliente</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                      {userProfile?.role === 'super' && <option value="super">Super Admin</option>}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start space-x-3">
        <div className="bg-blue-100 p-2 rounded-lg">
          <UserPlus className="w-5 h-5 text-royal-blue" />
        </div>
        <div>
          <h4 className="font-bold text-blue-900 text-sm">Como adicionar novos membros?</h4>
          <p className="text-blue-700 text-xs mt-1">
            Peça para o novo membro realizar o login com Google no site. Assim que ele logar, o perfil dele aparecerá nesta lista automaticamente. 
            Como <strong>{userProfile?.role === 'super' ? 'Super Admin' : 'Admin'}</strong>, você poderá então alterar o cargo dele para Staff ou Admin.
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Main Dashboard ---

export default function AdminDashboard({ userProfile }: { userProfile: UserProfile | null }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!userProfile || (userProfile.role !== 'super' && userProfile.role !== 'admin' && userProfile.role !== 'staff')) {
      navigate('/admin');
    }
  }, [userProfile, navigate]);

  const menuItems = [
    { path: '/admin/dashboard/appointments', label: 'Ordens de Serviço', icon: Wrench },
    { path: '/admin/dashboard/products', label: 'Vitrine', icon: ShoppingCart },
    { path: '/admin/dashboard/reservations', label: 'Lan House', icon: Gamepad2 },
    { path: '/admin/dashboard/users', label: 'Usuários & Equipe', icon: Users, adminOnly: true },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Dashboard Sidebar */}
      <aside className="w-full md:w-64 space-y-2">
        <div className="p-4 bg-royal-blue text-white rounded-xl mb-6 flex items-center space-x-3">
          <div className="bg-gold-beige p-2 rounded-lg">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs opacity-70">Painel do</p>
            <p className="font-bold">Amadeu</p>
          </div>
        </div>

        <nav className="space-y-1">
          {menuItems.map(item => {
            if (item.adminOnly && userProfile?.role !== 'super' && userProfile?.role !== 'admin') return null;
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  isActive ? 'bg-royal-blue text-white shadow-md' : 'text-gray-600 hover:bg-white hover:shadow-sm'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-gold-beige' : 'text-gray-400'}`} />
                <span className="font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Content Area */}
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<div className="p-12 text-center text-gray-400 bg-white rounded-2xl border-2 border-dashed">Selecione uma opção no menu lateral.</div>} />
          <Route path="/appointments" element={<AppointmentsManager />} />
          <Route path="/products" element={<ProductsManager />} />
          <Route path="/users" element={<TeamManager userProfile={userProfile} />} />
          <Route path="/reservations" element={<div className="p-12 text-center text-gray-400 bg-white rounded-2xl border-2 border-dashed">Gestão de Lan House em desenvolvimento...</div>} />
        </Routes>
      </div>
    </div>
  );
}
