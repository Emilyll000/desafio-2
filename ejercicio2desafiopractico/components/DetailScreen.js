import React from "react";
import { View, Text, Image, StyleSheet, ScrollView } from "react-native";

export default function DetailScreen({ route }) {
  const { platillo } = route.params;

  return (
    <ScrollView style={styles.container}>
      <Image source={platillo.foto} style={styles.image} />
      <Text style={styles.nombre}>{platillo.nombre}</Text>
      <Text style={styles.region}>Región: {platillo.region}</Text>
      <Text style={styles.categoria}>Categoría: {platillo.categoria}</Text>
      <Text style={styles.precio}>Precio: ${platillo.precio}</Text>
      <Text style={styles.descripcion}>{platillo.descripcion}</Text>

      <Text style={styles.subtitulo}>Ingredientes:</Text>
      {platillo.ingredientes.map((ing, i) => (
        <Text key={i} style={styles.ingrediente}>
          • {ing}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  image: { width: "100%", height: 200, borderRadius: 10, marginBottom: 12 },
  nombre: { fontSize: 22, fontWeight: "bold", marginBottom: 6 },
  region: { fontSize: 16, color: "#555" },
  categoria: { fontSize: 16, color: "#555" },
  precio: { fontSize: 16, color: "#555", marginBottom: 8 },
  descripcion: { fontSize: 16, marginVertical: 10 },
  subtitulo: { fontSize: 18, fontWeight: "bold", marginTop: 12 },
  ingrediente: { fontSize: 16, marginLeft: 8 },
});
