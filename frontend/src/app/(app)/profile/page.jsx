'use client';

import { useRef, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { User, Mail, Shield, Camera, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { actualizarPerfil } from '../../../services/users.service';
import { resizeImageToBase64 } from '../../../utils/image';

export default function ProfilePage() {
  const { user, userData, refreshUserData } = useAuth();
  const fileInputRef = useRef(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Formatear la fecha de creación si existe
  const formattedDate = userData?.createdAt 
    ? new Date(userData.createdAt).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    : 'Reciente';

  const displayData = {
    name: userData?.name || 'Usuario VetCare',
    email: user?.email || 'Cargando...',
    role: userData?.role || 'Cargando...',
    joinDate: formattedDate
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: displayData.name,
    password: ''
  });

  const handleOpenEdit = () => {
    setProfileForm({ name: displayData.name, password: '' });
    setIsModalOpen(true);
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite volver a elegir el mismo archivo después
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const photoURL = await resizeImageToBase64(file, { maxSize: 320, quality: 0.85 });
      await actualizarPerfil({ photoURL });
      await refreshUserData();
      Swal.fire({
        title: '¡Listo!',
        text: 'Foto de perfil actualizada.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(error);
      Swal.fire('Error', error.response?.data?.error || error.message || 'No se pudo actualizar la foto.', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (profileForm.password && profileForm.password.length < 6) {
      Swal.fire('Error', 'La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await actualizarPerfil(profileForm);
      await refreshUserData();

      Swal.fire('¡Éxito!', 'Perfil actualizado correctamente.', 'success');
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo actualizar el perfil.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-800">Mi Perfil</h2>
        <p className="text-zinc-500 mt-1">Gestiona tu información personal y preferencias de la cuenta.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
        {/* Cover background */}
        <div className="h-32 bg-gradient-to-r from-[#1e1b4b] via-indigo-900 to-indigo-700"></div>
        
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-8">
            <div className="relative">
              <div className="w-24 h-24 bg-white rounded-full p-1">
                <div className="w-full h-full bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 border border-zinc-200 overflow-hidden">
                  {userData?.photoURL ? (
                    <img src={userData.photoURL} alt="Foto de perfil" className="w-full h-full object-cover" />
                  ) : (
                    <User size={40} />
                  )}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
              <button
                type="button"
                onClick={handlePhotoClick}
                disabled={uploadingPhoto}
                className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors shadow-sm"
                title="Cambiar foto de perfil"
              >
                {uploadingPhoto ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Camera size={14} />
                )}
              </button>
            </div>
            
            <button 
              onClick={handleOpenEdit}
              className="px-4 py-2 border border-zinc-200 text-zinc-600 rounded-lg hover:bg-zinc-50 transition-colors font-medium text-sm"
            >
              Editar Perfil
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-zinc-800 mb-4">Información Personal</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Nombre Completo</label>
                    <div className="mt-1 flex items-center gap-3 text-zinc-800 bg-zinc-50 px-4 py-2 rounded-lg border border-zinc-100">
                      <User size={18} className="text-zinc-400" />
                      {displayData.name}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Correo Electrónico</label>
                    <div className="mt-1 flex items-center gap-3 text-zinc-800 bg-zinc-50 px-4 py-2 rounded-lg border border-zinc-100">
                      <Mail size={18} className="text-zinc-400" />
                      {displayData.email}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-zinc-800 mb-4">Detalles de la Cuenta</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Rol en el Sistema</label>
                    <div className="mt-1 flex items-center gap-3 text-zinc-800 bg-zinc-50 px-4 py-2 rounded-lg border border-zinc-100">
                      <Shield size={18} className="text-indigo-600" />
                      <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-sm font-medium">
                        {displayData.role}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Miembro desde</label>
                    <div className="mt-1 px-4 py-2 text-zinc-600 text-sm">
                      {displayData.joinDate}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl p-8 relative animate-in fade-in zoom-in duration-200">
            
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-zinc-600 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center mb-6">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3">
                <User size={24} />
              </div>
              <h3 className="text-2xl font-bold text-zinc-800">Editar Perfil</h3>
              <p className="text-zinc-500 text-sm mt-1">Actualiza tu información personal</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-zinc-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Nueva Contraseña <span className="text-xs text-zinc-400 font-normal ml-1">(Opcional)</span>
                </label>
                <input
                  type="password"
                  value={profileForm.password}
                  onChange={(e) => setProfileForm({...profileForm, password: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-zinc-800"
                  placeholder="Dejar en blanco para no cambiar"
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
                    'Guardar Cambios'
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
