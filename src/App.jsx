import React, { useState, useEffect } from 'react';
import { Calendar, Trash2, Save, LogOut, Check } from 'lucide-react';

// INSTRUCCIONES DE CONFIGURACIÓN:
// 1. Reemplaza estas variables con tus credenciales de Supabase
const SUPABASE_URL = 'TU_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'TU_SUPABASE_ANON_KEY';

// Definición de los slots del calendario de octubre
const CALENDAR_SLOTS = [
  // MIÉRCOLES 01/10
  { date: '01/10', day: 'MIERCOLES', time: '16H', type: 'Corina - Maria P', x: 48, y: 11.5 },
  { date: '01/10', day: 'MIERCOLES', time: 'MAT', type: 'Vane C - Debora', x: 48, y: 14 },
  { date: '01/10', day: 'MIERCOLES', time: 'EBI', type: 'Lizet', x: 48, y: 16.5 },
  
  // JUEVES 02/10
  { date: '02/10', day: 'JUEVES', time: 'Flor', type: 'Agustina', x: 63, y: 14 },
  
  // VIERNES 03/10
  { date: '03/10', day: 'VIERNES', time: '16H', type: 'Norma - Johanna', x: 78, y: 9.5 },
  { date: '03/10', day: 'VIERNES', time: 'MAT', type: 'Ludmila - Milagros', x: 78, y: 12.5 },
  { date: '03/10', day: 'VIERNES', time: 'EBI', type: 'Flor - Maria P', x: 78, y: 16 },
  
  // DOMINGO 05/10
  { date: '05/10', day: 'DOMINGO', time: '07H MAT', type: 'Brunella - Belen', x: 98, y: 10 },
  { date: '05/10', day: 'DOMINGO', time: '07H EBI', type: 'Flor - Jimena', x: 98, y: 11.5 },
  { date: '05/10', day: 'DOMINGO', time: 'MAT 9:30H', type: 'Norma - Agus - Yesica', x: 98, y: 13.5 },
  { date: '05/10', day: 'DOMINGO', time: 'EBI 9:30H', type: 'Johanna - Maria O', x: 98, y: 16 },
  { date: '05/10', day: 'DOMINGO', time: '15H', type: 'slot1', x: 98, y: 18.5 },
  { date: '05/10', day: 'DOMINGO', time: '18H', type: 'Leticia', x: 98, y: 20.5 },
  
  // LUNES 06/10
  { date: '06/10', day: 'LUNES', time: '16H', type: 'Ayelen - Susana', x: 8, y: 27.5 },
  { date: '06/10', day: 'LUNES', time: 'MAT', type: 'Ludmila - Brenda', x: 8, y: 30 },
  { date: '06/10', day: 'LUNES', time: 'EBI', type: 'Ale - Lizet', x: 8, y: 32.5 },
  
  // MARTES 07/10
  { date: '07/10', day: 'MARTES', time: 'slot1', type: 'Flor', x: 23, y: 30 },
  
  // MIÉRCOLES 08/10
  { date: '08/10', day: 'MIERCOLES', time: '16H', type: 'Nancy - Gisela', x: 48, y: 27.5 },
  { date: '08/10', day: 'MIERCOLES', time: 'MAT', type: 'Natalia - Vale C', x: 48, y: 30 },
  { date: '08/10', day: 'MIERCOLES', time: 'EBI', type: 'Catalina - Brunella', x: 48, y: 32.5 },
  
  // JUEVES 09/10
  { date: '09/10', day: 'JUEVES', time: 'Yesica', type: 'Milagros', x: 63, y: 30 },
  
  // VIERNES 10/10
  { date: '10/10', day: 'VIERNES', time: '16H', type: 'Nancy - Corina', x: 78, y: 25.5 },
  { date: '10/10', day: 'VIERNES', time: 'MAT', type: 'Vale S - Vane C - Vero - Milagros', x: 78, y: 28.5 },
  { date: '10/10', day: 'VIERNES', time: 'EBI', type: 'Leticia - Mabel - Rebe', x: 78, y: 32 },
  
  // DOMINGO 12/10
  { date: '12/10', day: 'DOMINGO', time: '07H MAT', type: 'Milu - Vale S', x: 98, y: 25.5 },
  { date: '12/10', day: 'DOMINGO', time: '07H EBI', type: 'Maria E - Maria P', x: 98, y: 27 },
  { date: '12/10', day: 'DOMINGO', time: 'MAT 9:30H', type: 'Cata - Gisela - Brenda - Luciana', x: 98, y: 29.5 },
  { date: '12/10', day: 'DOMINGO', time: 'EBI 9:30H', type: 'Eva - Mabel - Nancy', x: 98, y: 32.5 },
  { date: '12/10', day: 'DOMINGO', time: '15H', type: 'Rebeca - Lizet', x: 98, y: 34.5 },
  { date: '12/10', day: 'DOMINGO', time: '18H', type: 'Ayelen', x: 98, y: 36.5 },
];

const App = () => {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('');
  const [userLastName, setUserLastName] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar datos de Supabase
  const loadSlots = async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/calendar_slots?month=eq.octubre&year=eq.2024`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      const data = await response.json();
      setSlots(data || []);
    } catch (error) {
      console.error('Error loading slots:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadSlots();
      const interval = setInterval(loadSlots, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogin = () => {
    if (userName.trim() && userLastName.trim()) {
      setUser({
        name: userName.trim(),
        lastNameInitial: userLastName.trim()[0].toUpperCase()
      });
    }
  };

  const handleLogout = () => {
    setUser(null);
    setUserName('');
    setUserLastName('');
    setSelectedSlots([]);
  };

  const getSlotData = (slotDef) => {
    return slots.find(s => 
      s.date === slotDef.date && 
      s.time_slot === slotDef.time && 
      s.slot_type === slotDef.type
    );
  };

  const isSlotOccupied = (slotDef) => {
    const slotData = getSlotData(slotDef);
    return slotData && slotData.user_name;
  };

  const isSlotMine = (slotDef) => {
    const slotData = getSlotData(slotDef);
    return slotData && slotData.user_name === user.name && slotData.user_lastname_initial === user.lastNameInitial;
  };

  const handleSlotClick = (slotDef) => {
    if (isSlotOccupied(slotDef) && !isSlotMine(slotDef)) return;
    
    const slotKey = `${slotDef.date}-${slotDef.time}-${slotDef.type}`;
    
    if (selectedSlots.includes(slotKey)) {
      setSelectedSlots(selectedSlots.filter(s => s !== slotKey));
    } else {
      setSelectedSlots([...selectedSlots, slotKey]);
    }
  };

  const handleRemoveSlot = async (slotDef) => {
    const slotData = getSlotData(slotDef);
    if (!slotData || !isSlotMine(slotDef) || slotData.locked) return;

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/calendar_slots?id=eq.${slotData.id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      await loadSlots();
    } catch (error) {
      console.error('Error removing slot:', error);
      alert('Error al eliminar el turno');
    }
  };

  const handleSaveChanges = async () => {
    if (selectedSlots.length < 3) {
      alert('Debes seleccionar al menos 3 turnos');
      return;
    }

    setLoading(true);
    try {
      const slotsToSave = selectedSlots.map(slotKey => {
        const [date, time, type] = slotKey.split('-');
        const slotDef = CALENDAR_SLOTS.find(s => s.date === date && s.time === time && s.type === type);
        return {
          month: 'octubre',
          year: 2024,
          date: date,
          day_name: slotDef.day,
          time_slot: time,
          slot_type: type,
          user_name: user.name,
          user_lastname_initial: user.lastNameInitial,
          locked: true
        };
      });

      for (const slot of slotsToSave) {
        await fetch(`${SUPABASE_URL}/rest/v1/calendar_slots`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(slot)
        });
      }

      setSelectedSlots([]);
      await loadSlots();
      alert('¡Turnos guardados exitosamente!');
    } catch (error) {
      console.error('Error saving slots:', error);
      alert('Error al guardar los turnos');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-100 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="flex items-center justify-center mb-6">
            <Calendar className="w-12 h-12 text-pink-500" />
          </div>
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
            Escala Mensual
          </h1>
          <p className="text-center text-gray-600 mb-8">de Educadoras</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Tu nombre"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apellido
              </label>
              <input
                type="text"
                value={userLastName}
                onChange={(e) => setUserLastName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Tu apellido"
              />
            </div>
            
            <button
              onClick={handleLogin}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Iniciar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-100 to-purple-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Bienvenida, {user.name} {user.lastNameInitial}.
            </h2>
            <p className="text-sm text-gray-600">
              Selecciona al menos 3 turnos y guarda tus cambios
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
          <div className="flex gap-4 justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold text-pink-500">{selectedSlots.length}</p>
              <p className="text-sm text-gray-600">Turnos seleccionados</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-500">
                {slots.filter(s => s.user_name === user.name && s.user_lastname_initial === user.lastNameInitial).length}
              </p>
              <p className="text-sm text-gray-600">Turnos guardados</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 mb-4 overflow-auto">
          <div className="relative min-w-[800px]">
            <img 
              src="https://i.imgur.com/YOUR_IMAGE_ID.png" 
              alt="Calendario"
              className="w-full rounded-lg"
            />
            
            {CALENDAR_SLOTS.map((slot, index) => {
              const slotData = getSlotData(slot);
              const isOccupied = isSlotOccupied(slot);
              const isMine = isSlotMine(slot);
              const slotKey = `${slot.date}-${slot.time}-${slot.type}`;
              const isSelected = selectedSlots.includes(slotKey);
              
              return (
                <div
                  key={index}
                  onClick={() => handleSlotClick(slot)}
                  className={`absolute cursor-pointer transition-all ${
                    isOccupied && !isMine ? 'cursor-not-allowed' : ''
                  }`}
                  style={{
                    left: `${slot.x}%`,
                    top: `${slot.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className={`
                    px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap
                    ${isSelected ? 'bg-green-500 text-white' : ''}
                    ${isOccupied && isMine ? 'bg-blue-500 text-white' : ''}
                    ${isOccupied && !isMine ? 'bg-gray-400 text-white' : ''}
                    ${!isOccupied && !isSelected ? 'bg-yellow-200 hover:bg-yellow-300' : ''}
                  `}>
                    {isOccupied && slotData ? 
                      `${slotData.user_name} ${slotData.user_lastname_initial}.` : 
                      isSelected ?
                      `${user.name} ${user.lastNameInitial}.` :
                      '______'
                    }
                  </div>
                  
                  {isMine && slotData && !slotData.locked && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSlot(slot);
                      }}
                      className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4">
          <button
            onClick={handleSaveChanges}
            disabled={selectedSlots.length < 3 || loading}
            className={`w-full py-4 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
              selectedSlots.length < 3 || loading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {loading ? (
              <>Guardando...</>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Guardar Cambios {selectedSlots.length >= 3 && <Check className="w-5 h-5" />}
              </>
            )}
          </button>
          {selectedSlots.length < 3 && (
            <p className="text-center text-sm text-red-500 mt-2">
              Necesitas seleccionar al menos {3 - selectedSlots.length} turno(s) más
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
