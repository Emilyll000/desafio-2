import React, { useEffect, useState, useContext, createContext, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  useWindowDimensions,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const STORAGE_KEY = '@citas_taller';
const Stack = createNativeStackNavigator();

const generateId = () => Date.now().toString() + Math.random().toString(36).substring(2, 9);

function parseDateTime(dateStr, timeStr) {
  const dt = new Date(`${dateStr}T${timeStr}:00`);
  if (isNaN(dt.getTime())) return null;
  return dt;
}

const CitasContext = createContext();

function CitasProvider({ children }) {
  const [citas, setCitas] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setCitas(JSON.parse(raw));
      } catch (e) {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(citas));
      } catch (e) {}
    })();
  }, [citas]);

  const addCita = (cita) => {
    setCitas(prev => [...prev, cita]);
  };

  const updateCita = (updated) => {
    setCitas(prev => prev.map(c => (c.id === updated.id ? updated : c)));
  };

  const deleteCita = (id) => {
    setCitas(prev => prev.filter(c => c.id !== id));
  };

  return (
    <CitasContext.Provider value={{ citas, addCita, updateCita, deleteCita }}>
      {children}
    </CitasContext.Provider>
  );
}

function useCitas() {
  return useContext(CitasContext);
}

function Card({ item, onDelete, onEdit }) {
  return (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{item.nombre}</Text>
        <Text style={styles.cardText}>Vehículo: {item.modelo}</Text>
        <Text style={styles.cardText}>Fecha: {item.fecha} {item.hora}</Text>
        {item.descripcion ? <Text style={styles.cardText}>Nota: {item.descripcion}</Text> : null}
      </View>

      <View style={styles.cardButtons}>
        <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(item)}>
          <Text style={styles.btnText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(item)}>
          <Text style={styles.btnText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function InicioScreen({ navigation }) {
  const { citas, deleteCita } = useCitas();
  const { width, height } = useWindowDimensions();
  const numColumns = width > height ? 2 : 1;

  const sorted = useMemo(() => {
    return [...citas].sort((a, b) => new Date(`${a.fecha}T${a.hora}:00`) - new Date(`${b.fecha}T${b.hora}:00`));
  }, [citas]);

  const handleDelete = (item) => {
    Alert.alert(
      'Eliminar cita',
      `¿Eliminar la cita de ${item.nombre} (${item.modelo}) el ${item.fecha} ${item.hora}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            deleteCita(item.id);
          }
        }
      ]
    );
  };

  const handleEdit = (item) => {
    navigation.navigate('Editar Cita', { citaId: item.id });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Citas - Taller Mecánico</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('Agregar Cita')}>
          <Text style={styles.addBtnText}>+ Agregar</Text>
        </TouchableOpacity>
      </View>

      {sorted.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No hay citas. Usa + Agregar para crear una.</Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Card item={item} onDelete={handleDelete} onEdit={handleEdit} />}
          contentContainerStyle={{ paddingBottom: 120 }}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 ? { justifyContent: 'space-between' } : null}
        />
      )}
    </View>
  );
}

function Form({ initial = null, onSave }) {
  const { citas } = useCitas();
  const [nombre, setNombre] = useState(initial ? initial.nombre : '');
  const [modelo, setModelo] = useState(initial ? initial.modelo : '');
  const [fecha, setFecha] = useState(initial ? initial.fecha : '');
  const [hora, setHora] = useState(initial ? initial.hora : '');
  const [descripcion, setDescripcion] = useState(initial ? initial.descripcion : '');

  const validate = () => {
    if (!nombre || nombre.trim().length < 3) {
      Alert.alert('Validación', 'El nombre del cliente debe tener al menos 3 caracteres.');
      return false;
    }
    const dt = parseDateTime(fecha, hora);
    if (!dt) {
      Alert.alert('Validación', 'Formato de fecha/hora inválido. Fecha: YYYY-MM-DD, Hora: HH:MM');
      return false;
    }
    if (dt <= new Date()) {
      Alert.alert('Validación', 'La fecha y hora deben ser posteriores al momento actual.');
      return false;
    }
    const duplicate = citas.find(c => {
      if (initial && c.id === initial.id) return false;
      return c.fecha === fecha && c.modelo.trim().toLowerCase() === modelo.trim().toLowerCase();
    });
    if (duplicate) {
      Alert.alert('Validación', 'Ya existe una cita para ese vehículo en la misma fecha.');
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload = {
      id: initial ? initial.id : generateId(),
      nombre: nombre.trim(),
      modelo: modelo.trim(),
      fecha,
      hora,
      descripcion: descripcion.trim(),
    };
    onSave(payload);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.formContainer}>
        <Text style={styles.label}>Nombre del cliente *</Text>
        <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Ej: Juan Perez" placeholderTextColor="#cbd5e1" />

        <Text style={styles.label}>Modelo del vehículo *</Text>
        <TextInput style={styles.input} value={modelo} onChangeText={setModelo} placeholder="Ej: Toyota Corolla 2015" placeholderTextColor="#cbd5e1" />

        <Text style={styles.label}>Fecha (YYYY-MM-DD) *</Text>
        <TextInput style={styles.input} value={fecha} onChangeText={setFecha} placeholder="2025-09-05" placeholderTextColor="#cbd5e1" />

        <Text style={styles.label}>Hora (HH:MM - 24h) *</Text>
        <TextInput style={styles.input} value={hora} onChangeText={setHora} placeholder="14:30" placeholderTextColor="#cbd5e1" />

        <Text style={styles.label}>Descripción (opcional)</Text>
        <TextInput style={[styles.input, { height: 80 }]} value={descripcion} onChangeText={setDescripcion} placeholder="Descripción del problema" multiline placeholderTextColor="#cbd5e1" />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit}>
          <Text style={styles.saveBtnText}>{initial ? 'Guardar cambios' : 'Crear cita'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function AgregarScreen({ navigation }) {
  const { addCita } = useCitas();

  const onSave = (newCita) => {
    addCita(newCita);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Form onSave={onSave} />
    </View>
  );
}

function EditarScreen({ route, navigation }) {
  const { citas, updateCita } = useCitas();
  const citaId = route.params?.citaId || route.params?.cita?.id;
  const current = citas.find(c => c.id === citaId) || route.params?.cita || null;

  const onSave = (updated) => {
    updateCita(updated);
    navigation.goBack();
  };

  if (!current) {
    return (
      <View style={styles.container}>
        <Text style={{ color: '#fff' }}>No se encontró la cita para editar.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Form initial={current} onSave={onSave} />
    </View>
  );
}

export default function App() {
  return (
    <CitasProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#1e3a8a' }, headerTintColor: '#fff' }}>
          <Stack.Screen name="Inicio" component={InicioScreen} />
          <Stack.Screen name="Agregar Cita" component={AgregarScreen} />
          <Stack.Screen name="Editar Cita" component={EditarScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </CitasProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: '#1e3a8a',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  addBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#cbd5e1',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flex: 1,
    minWidth: 160,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    color: '#fff',
  },
  cardText: {
    fontSize: 13,
    color: '#e0f2fe',
  },
  cardButtons: {
    marginLeft: 8,
    alignItems: 'flex-end',
  },
  editBtn: {
    backgroundColor: '#60a5fa',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 6,
  },
  deleteBtn: {
    backgroundColor: '#f87171',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
  },
  formContainer: {
    padding: 12,
    paddingBottom: 40,
    alignItems: 'center',
  },
  label: {
    fontWeight: '600',
    marginTop: 8,
    color: '#fff',
    alignSelf: 'flex-start',
  },
  input: {
    borderWidth: 1,
    borderColor: '#60a5fa',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
    width: '100%',
    backgroundColor: '#1e40af',
    color: '#fff',
  },
  saveBtn: {
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 10,
    marginTop: 18,
    alignItems: 'center',
    width: '100%',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});