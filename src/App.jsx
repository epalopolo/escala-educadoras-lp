import React, { useState, useEffect } from 'react';
import { Calendar, Trash2, Save, LogOut, Upload, Eye, CheckCircle, Settings, Loader } from 'lucide-react';

// CONFIGURACIÓN DE SUPABASE
const SUPABASE_URL = 'TU_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'TU_SUPABASE_ANON_KEY';

// Contraseña de admin (en producción, usa autenticación real)
const ADMIN_PASSWORD = 'admin123';

const App = () => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState('');
  const [userLastName, setUserLastName] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Admin states
  const [adminPassword, setAdminPassword] = useState('');
  const [currentCalendar, setCurrentCalendar] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [detectedSlots, setDetectedSlots] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState('');
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  // Cargar calendario activo
  const loadCurrentCalendar = async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/calendars?active=eq.true&order=created_at.desc&limit=1`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      const data = await response.json();
      if (data && data.length > 0) {
        setCurrentCalendar(data[0]);
      }
    } catch (error) {
      console.error('Error loading calendar:', error);
    }
  };

  // Cargar slots del calendario activo
  const loadSlots = async () => {
    if (!currentCalendar) return;
    
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/calendar_slots?calendar_id=eq.${currentCalendar.id}`, {
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
    loadCurrentCalendar();
  }, []);

  useEffect(() => {
    if (currentCalendar) {
      loadSlots();
      if (user) {
        const interval = setInterval(loadSlots, 5000);
        return () => clearInterval(interval);
      }
    }
  }, [currentCalendar, user]);

  const handleLogin = () => {
    if (userName.trim() && userLastName.trim()) {
      setUser({
        name: userName.trim(),
        lastNameInitial: userLastName.trim()[0].toUpperCase()
      });
    }
  };

  const handleAdminLogin = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setAdminPassword('');
    } else {
      alert('Contraseña incorrecta');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setUserName('');
    setUserLastName('');
    setSelectedSlots([]);
    setIsAdmin(false);
  };

  // Procesar imagen y detectar espacios clickeables
  const processImage = async (imageFile) => {
    setIsProcessing(true);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const img = new Image();
        img.onload = async () => {
          // Crear canvas para procesar la imagen
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          
          // Detectar espacios en blanco y líneas subrayadas (_______)
          const detected = await detectClickableAreas(canvas, img.width, img.height);
          setDetectedSlots(detected);
          setUploadedImage(e.target.result);
          setIsProcessing(false);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(imageFile);
    } catch (error) {
      console.error('Error processing image:', error);
      setIsProcessing(false);
      alert('Error al procesar la imagen');
    }
  };

  // Detectar áreas clickeables en la imagen
  const detectClickableAreas = async (canvas, width, height) => {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, width, height);
    const detected = [];
    
    // Buscar patrones de texto y líneas de guión bajo
    const cellHeight = Math.floor(height / 40); // Aproximadamente 40 filas
    const cellWidth = Math.floor(width / 8); // Aproximadamente 8 columnas
    
    for (let row = 0; row < 40; row++) {
      for (let col = 0; col < 8; col++) {
        const x = col * cellWidth + cellWidth / 2;
        const y = row * cellHeight + cellHeight / 2;
        
        // Analizar el área alrededor de esta coordenada
        const hasContent = analyzeArea(imageData, x, y, cellWidth, cellHeight, width);
        
        if (hasContent) {
          detected.push({
            id: `slot-${row}-${col}`,
            x: (x / width) * 100,
            y: (y / height) * 100,
            width: (cellWidth / width) * 100,
            height: (cellHeight / height) * 100,
            date: '', // Se llenará manualmente en la vista previa
            time: '',
            type: ''
          });
        }
      }
    }
    
    return detected;
  };

  // Analizar un área específica para detectar texto o líneas
  const analyzeArea = (imageData, x, y, width, height, canvasWidth) => {
    let darkPixels = 0;
    let totalPixels = 0;
    
    const startX = Math.max(0, Math.floor(x - width / 2));
    const endX = Math.min(canvasWidth, Math.floor(x + width / 2));
    const startY = Math.max(0, Math.floor(y - height / 2));
    const endY = Math.min(imageData.height, Math.floor(y + height / 2));
    
    for (let py = startY; py < endY; py++) {
      for (let px = startX; px < endX; px++) {
        const index = (py * canvasWidth + px) * 4;
        const r = imageData.data[index];
        const g = imageData.data[index + 1];
        const b = imageData.data[index + 2];
        const brightness = (r + g + b) / 3;
        
        if (brightness < 200) darkPixels++;
        totalPixels++;
      }
    }
    
    const ratio = darkPixels / totalPixels;
    return ratio > 0.05 && ratio < 0.5; // Tiene algo de contenido pero no está completamente lleno
  };

  // Guardar calendario con slots detectados
  const saveCalendar = async () => {
    if (!calendarMonth || !uploadedImage || detectedSlots.length === 0) {
      alert('Completa todos los campos y detecta los espacios');
      return;
    }
    
    setLoading(true);
    try {
      // 1. Desactivar calendarios anteriores
      await fetch(`${SUPABASE_URL}/rest/v1/calendars?active=eq.true`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ active: false })
      });
      
      // 2. Crear nuevo calendario
      const calendarResponse = await fetch(`${SUPABASE_URL}/rest/v1/calendars`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          month: calendarMonth,
          year: calendarYear,
          image_url: uploadedImage,
          active: true
        })
      });
      
      const newCalendar = await calendarResponse.json();
      const calendarId = newCalendar[0].id;
      
      // 3. Crear slots detectados
      for (const slot of detectedSlots) {
        await fetch(`${SUPABASE_URL}/rest/v1/calendar_slots`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            calendar_id: calendarId,
            slot_id: slot.id,
            x_position: slot.x,
            y_position: slot.y,
            width: slot.width,
            height: slot.height,
            date: slot.date || '',
            time_slot: slot.time || '',
            slot_type: slot.type || '',
            user_name: null,
            user_lastname_initial: null,
            locked: false
          })
        });
      }
      
      alert('¡Calendario guardado exitosamente!');
      setUploadedImage(null);
      setDetectedSlots([]);
      setCalendarMonth('');
      await loadCurrentCalendar();
    } catch (error) {
      console.error('Error saving calendar:', error);
      alert('Error al guardar el calendario');
    } finally {
      setLoading(false);
    }
  };

  const getSlotData = (slotDef) => {
    return slots.find(s => s.slot_id === slotDef.id);
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
    
    const slotKey = slotDef.id;
    
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
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_name: null,
          user_lastname_initial: null
        })
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
      for (const slotKey of selectedSlots) {
        const slotDef = slots.find(s => s.slot_id === slotKey);
        if (slotDef) {
          await fetch(`${SUPABASE_URL}/rest/v1/calendar_slots?id=eq.${slotDef.id}`, {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              user_name: user.name,
              user_lastname_initial: user.lastNameInitial,
              locked: true
            })
          });
        }
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

  // Admin Panel
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <Settings className="w-8 h-8 text-indigo-600" />
                <h1 className="text-2xl font-bold text-gray-800">Panel de Administración</h1>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">Subir Nuevo Calendario</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mes
                    </label>
                    <input
                      type="text"
                      value={calendarMonth}
                      onChange={(e) => setCalendarMonth(e.target.value)}
                      placeholder="Ej: octubre, noviembre..."
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Año
                    </label>
                    <input
                      type="number"
                      value={calendarYear}
                      onChange={(e) => setCalendarYear(parseInt(e.target.value))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Imagen del Calendario
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) processImage(file);
                      }}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300"
                    />
                  </div>

                  {isProcessing && (
                    <div className="flex items-center gap-2 text-indigo-600">
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Detectando espacios clickeables...</span>
                    </div>
                  )}

                  {detectedSlots.length > 0 && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold">
                          {detectedSlots.length} espacios detectados
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={saveCalendar}
                    disabled={loading || !uploadedImage || detectedSlots.length === 0}
                    className={`w-full py-3 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                      loading || !uploadedImage || detectedSlots.length === 0
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    <Save className="w-5 h-5" />
                    {loading ? 'Guardando...' : 'Guardar Calendario'}
                  </button>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-4">Vista Previa</h2>
                {uploadedImage ? (
                  <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden">
                    <img src={uploadedImage} alt="Preview" className="w-full" />
                    {detectedSlots.map((slot, index) => (
                      <div
                        key={index}
                        className="absolute border-2 border-red-500 bg-red-100 bg-opacity-30"
                        style={{
                          left: `${slot.x}%`,
                          top: `${slot.y}%`,
                          width: `${slot.width}%`,
                          height: `${slot.height}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        <span className="text-xs text-red-700 font-bold">{index + 1}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <Upload className="w-16 h-16 mx-auto mb-2" />
                      <p>Sube una imagen para ver la vista previa</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {currentCalendar && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Calendario Activo</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Mes</p>
                  <p className="text-lg font-bold">{currentCalendar.month}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Año</p>
                  <p className="text-lg font-bold">{currentCalendar.year}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Turnos ocupados</p>
                  <p className="text-lg font-bold">{slots.filter(s => s.user_name).length}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Login Screen
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

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">o</span>
              </div>
            </div>

            <div className="space-y-2">
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                placeholder="Contraseña de administrador"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
              <button
                onClick={handleAdminLogin}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Acceso Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User Calendar View
  if (!currentCalendar) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-100 to-purple-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Calendar className="w-16 h-16 text-pink-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800">No hay calendario activo</h2>
          <p className="text-gray-600">Contacta al administrador</p>
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
              {currentCalendar.month} {currentCalendar.year} - Selecciona al menos 3 turnos
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
              src={currentCalendar.image_url} 
              alt="Calendario"
              className="w-full rounded-lg"
            />
            
            {slots.map((slot, index) => {
              const isOccupied = slot.user_name !== null;
              const isMine = slot.user_name === user.name && slot.user_lastname_initial === user.lastNameInitial;
              const isSelected = selectedSlots.includes(slot.slot_id);
              
              return (
                <div
                  key={index}
                  onClick={() => handleSlotClick(slot)}
                  className={`absolute cursor-pointer transition-all ${
                    isOccupied && !isMine ? 'cursor-not-allowed' : ''
                  }`}
                  style={{
                    left: `${slot.x_position}%`,
                    top: `${slot.y_position}%`,
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
                    {isOccupied ? 
                      `${slot.user_name} ${slot.user_lastname_initial}.` : 
                      isSelected ?
                      `${user.name} ${user.lastNameInitial}.` :
                      '______'
                    }
                  </div>
                  
                  {isMine && !slot.locked && (
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
