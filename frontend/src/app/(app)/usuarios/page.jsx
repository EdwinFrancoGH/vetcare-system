'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Shield, Trash2, Mail, User, Clock, AlertCircle, Plus, Pencil } from 'lucide-react';
import Swal from 'sweetalert2';
import {
  obtenerUsuarios,
  crearUsuario,
  actualizarUsuario,
  actualizarRolUsuario,
  eliminarUsuario as eliminarUsuarioApi,
} from '../../../services/users.service';

export default function UsuariosPage() {
  const { user, userRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Administrador'
  });
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    if (userRole === 'Administrador') {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [userRole]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await obtenerUsuarios();
      setUsers(data);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo cargar la lista de usuarios.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    setNewUser({ name: '', email: '', password: '', role: 'Administrador' });
    setIsModalOpen(true);
  };

  const handleEdit = (u) => {
    setEditingUser(u);
    setNewUser({ name: u.name || '', email: u.email || '', password: '', role: u.role || 'Administrador' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!editingUser && newUser.password.length < 6) {
      Swal.fire('Error', 'La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }
    
    if (editingUser && newUser.password && newUser.password.length < 6) {
      Swal.fire('Error', 'La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { data } = editingUser
        ? await actualizarUsuario(editingUser.uid, newUser)
        : await crearUsuario(newUser);

      if (editingUser) {
        setUsers(users.map(u => u.uid === editingUser.uid ? { ...u, ...data.user } : u));
        Swal.fire('¡Éxito!', 'Usuario actualizado correctamente.', 'success');
      } else {
        setUsers([...users, data.user]);
        Swal.fire('¡Éxito!', 'Usuario creado correctamente.', 'success');
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', error.response?.data?.details || error.response?.data?.error || error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (uid, newRole) => {
    try {
      await actualizarRolUsuario(uid, newRole);

      Swal.fire({
        title: '¡Actualizado!',
        text: 'El rol ha sido cambiado exitosamente.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      
      setUsers(users.map(u => u.uid === uid ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo actualizar el rol.', 'error');
    }
  };

  const handleDelete = async (uid, userName) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Eliminarás permanentemente al usuario ${userName}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#71717a',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await eliminarUsuarioApi(uid);

        Swal.fire('Eliminado', 'El usuario ha sido borrado del sistema.', 'success');

        setUsers(users.filter(u => u.uid !== uid));
      } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo eliminar al usuario.', 'error');
      }
    }
  };

  const roleStyles = {
    Administrador: 'bg-red-100 text-red-700 border-red-200',
    Recepcionista: 'bg-blue-100 text-blue-700 border-blue-200',
    Veterinario: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Cliente: 'bg-zinc-100 text-zinc-700 border-zinc-200'
  };

  if (userRole !== 'Administrador') {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-zinc-500">
        <AlertCircle size={48} className="mb-4 text-red-400" />
        <h2 className="text-xl font-bold text-zinc-800">Acceso Denegado</h2>
        <p>No tienes permisos para ver esta página.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-zinc-800">Gestor de Usuarios</h2>
          <p className="text-zinc-500 mt-1">Administra los accesos y roles del personal de la clínica.</p>
        </div>
        <button 
          onClick={handleCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors font-medium"
        >
          <Plus size={18} />
          Nuevo Usuario
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100 text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4">Fecha de Ingreso</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-zinc-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      Cargando usuarios...
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-zinc-500">
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.uid} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-800">{u.name || 'Sin Nombre'}</p>
                          <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                            <Mail size={12} /> {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Shield size={16} className="text-zinc-400" />
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.uid, e.target.value)}
                          disabled={u.uid === user.uid}
                          className={`text-xs font-semibold px-2 py-1 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${roleStyles[u.role] || 'bg-zinc-100 text-zinc-700'} ${u.uid === user.uid ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <option value="Administrador">Administrador</option>
                          <option value="Recepcionista">Recepcionista</option>
                          <option value="Veterinario">Veterinario</option>
                          <option value="Cliente">Cliente</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-zinc-600 flex items-center gap-2">
                        <Clock size={14} className="text-zinc-400" />
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Desconocido'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(u)}
                          className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Editar usuario"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(u.uid, u.name || u.email)}
                          disabled={u.uid === user.uid}
                          className={`p-2 rounded-lg transition-colors ${u.uid === user.uid ? 'text-zinc-300 cursor-not-allowed' : 'text-zinc-400 hover:text-red-500 hover:bg-red-50'}`}
                          title={u.uid === user.uid ? "No puedes eliminarte a ti mismo" : "Eliminar usuario"}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl p-8 relative animate-in fade-in zoom-in duration-200">
            
            <div className="flex flex-col items-center mb-6">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3">
                {editingUser ? <Pencil size={24} /> : <User size={24} />}
              </div>
              <h3 className="text-2xl font-bold text-zinc-800">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
              <p className="text-zinc-500 text-sm mt-1">{editingUser ? 'Actualiza los datos del usuario' : 'Registra a un nuevo miembro del equipo'}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-zinc-800"
                  placeholder="Ej. Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-zinc-800"
                  placeholder="juan@vetcare.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Contraseña {editingUser && <span className="text-xs text-zinc-400 font-normal ml-1">(Dejar en blanco para no cambiar)</span>}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-zinc-800"
                  placeholder={editingUser ? "••••••••" : "Mínimo 6 caracteres"}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Rol</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-zinc-800"
                >
                  <option value="Administrador">Administrador</option>
                  <option value="Recepcionista">Recepcionista</option>
                  <option value="Veterinario">Veterinario</option>
                  <option value="Cliente">Cliente</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-zinc-200 text-zinc-600 font-semibold rounded-xl hover:bg-zinc-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors flex justify-center items-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    editingUser ? 'Actualizar Usuario' : 'Guardar Usuario'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
