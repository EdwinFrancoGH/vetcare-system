'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Users, Trash2, Mail, Phone, Edit2, Plus, MapPin } from 'lucide-react';
import Swal from 'sweetalert2';

export default function ClientesPage() {
  const { user } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    correo: '',
    direccion: ''
  });

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const idToken = await user.getIdToken();
      const response = await fetch('http://localhost:5000/api/clientes', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      if (!response.ok) throw new Error('Error al cargar clientes');
      
      const data = await response.json();
      setClientes(data);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo cargar la lista de clientes.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCliente(null);
    setFormData({ nombre: '', telefono: '', correo: '', direccion: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      correo: cliente.correo || '',
      direccion: cliente.direccion || ''
    });
    setIsModalOpen(true);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const idToken = await user.getIdToken();
      
      if (editingCliente) {
        // Update
        const response = await fetch(`http://localhost:5000/api/clientes/${editingCliente.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Error al actualizar cliente');
        const data = await response.json();
        setClientes(clientes.map(c => c.id === editingCliente.id ? { ...c, ...data.cliente } : c));
        Swal.fire({ title: '¡Actualizado!', text: 'Los datos han sido actualizados.', icon: 'success', timer: 1500, showConfirmButton: false });
      } else {
        // Create
        const response = await fetch('http://localhost:5000/api/clientes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Error al crear cliente');
        const data = await response.json();
        setClientes([...clientes, data.cliente]);
        Swal.fire({ title: '¡Éxito!', text: 'Cliente registrado.', icon: 'success', timer: 1500, showConfirmButton: false });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, nombre) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Eliminarás a ${nombre}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const idToken = await user.getIdToken();
        const response = await fetch(`http://localhost:5000/api/clientes/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${idToken}` }
        });

        if (!response.ok) throw new Error('Error al eliminar');

        setClientes(clientes.filter(c => c.id !== id));
        Swal.fire('Eliminado', 'Cliente borrado.', 'success');
      } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo eliminar al cliente.', 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-zinc-800">Gestor de Clientes</h2>
          <p className="text-zinc-500 mt-1">Directorio de dueños de mascotas registrados.</p>
        </div>
        <button 
          onClick={handleCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors font-medium"
        >
          <Plus size={18} />
          Nuevo Cliente
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100 text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Contacto</th>
                <th className="px-6 py-4">Dirección</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-zinc-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      Cargando clientes...
                    </div>
                  </td>
                </tr>
              ) : clientes.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-zinc-500">
                    No hay clientes registrados.
                  </td>
                </tr>
              ) : (
                clientes.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                          <Users size={20} />
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-800">{c.nombre}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            Registrado: {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Desconocido'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      <p className="text-sm text-zinc-700 flex items-center gap-2">
                        <Phone size={14} className="text-zinc-400" /> {c.telefono}
                      </p>
                      {c.correo && (
                        <p className="text-xs text-zinc-500 flex items-center gap-2">
                          <Mail size={14} className="text-zinc-400" /> {c.correo}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-zinc-600 flex items-start gap-2">
                        <MapPin size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                        {c.direccion || <span className="text-zinc-400 italic">Sin dirección</span>}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => handleEdit(c)}
                        className="p-2 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(c.id, c.nombre)}
                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Modal for Creating/Editing Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl p-8 relative animate-in fade-in zoom-in duration-200">
            
            <div className="flex flex-col items-center mb-6">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3">
                <Users size={24} />
              </div>
              <h3 className="text-2xl font-bold text-zinc-800">
                {editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h3>
              <p className="text-zinc-500 text-sm mt-1">
                {editingCliente ? 'Actualiza los datos del cliente' : 'Registra un nuevo dueño de mascota'}
              </p>
            </div>

            <form onSubmit={submitForm} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-zinc-800"
                  placeholder="Ej. María Gómez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Teléfono</label>
                <input
                  type="text"
                  required
                  value={formData.telefono}
                  onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-zinc-800"
                  placeholder="Ej. +1 234 567 890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Correo (Opcional)</label>
                <input
                  type="email"
                  value={formData.correo}
                  onChange={(e) => setFormData({...formData, correo: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-zinc-800"
                  placeholder="maria@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Dirección (Opcional)</label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-zinc-800"
                  placeholder="Ej. Calle Principal 123"
                />
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
                    editingCliente ? 'Actualizar' : 'Guardar Cliente'
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
