'use client';

import { Users, Calendar as CalendarIcon, PawPrint, TrendingUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const { userData } = useAuth();
  const displayName = userData?.name || 'Usuario';

  const stats = [
    { name: 'Pacientes Activos', value: '1,245', icon: PawPrint, trend: '+12%', color: 'text-indigo-500', bg: 'bg-indigo-100' },
    { name: 'Citas de Hoy', value: '24', icon: CalendarIcon, trend: '+4', color: 'text-blue-500', bg: 'bg-blue-100' },
    { name: 'Nuevos Clientes', value: '18', icon: Users, trend: '+5%', color: 'text-purple-500', bg: 'bg-purple-100' },
    { name: 'Ingresos Mensuales', value: '$8,450', icon: TrendingUp, trend: '+14%', color: 'text-orange-500', bg: 'bg-orange-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-zinc-800">Bienvenido de nuevo, {displayName}</h2>
          <p className="text-zinc-500 mt-1">Aquí tienes un resumen de la clínica hoy.</p>
        </div>
        <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-sm transition-colors font-medium">
          Nueva Cita
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-zinc-500">{stat.name}</p>
                  <h3 className="text-3xl font-bold text-zinc-800 mt-2">{stat.value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                  <Icon size={24} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-emerald-500 font-medium">{stat.trend}</span>
                <span className="text-zinc-400 ml-2">vs el mes anterior</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="bg-white lg:col-span-2 rounded-2xl shadow-sm border border-zinc-100 p-6 min-h-[400px]">
          <h3 className="text-lg font-bold text-zinc-800 mb-4">Próximas Citas</h3>
          <div className="flex items-center justify-center h-64 text-zinc-400 border-2 border-dashed border-zinc-200 rounded-xl">
            Gráfico o tabla de citas aquí
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6">
          <h3 className="text-lg font-bold text-zinc-800 mb-4">Mascotas Recientes</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer border border-transparent hover:border-zinc-100">
                <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-500">
                  <PawPrint size={20} />
                </div>
                <div>
                  <p className="font-semibold text-zinc-800">Max</p>
                  <p className="text-sm text-zinc-500">Golden Retriever</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
