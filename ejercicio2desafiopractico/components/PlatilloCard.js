import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";

export default function PlatilloCard({ platillo, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
    <Image source={platillo.foto} style={styles.image} />
      <Text style={styles.nombre}>{platillo.nombre}</Text>
      <Text numberOfLines={2} style={styles.descripcion}>
        {platillo.descripcion}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#fff",
    elevation: 3,
  },
  image: {
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  nombre: {
    fontSize: 16,
    fontWeight: "bold",
  },
  descripcion: {
    fontSize: 14,
    color: "#555",
  },
});
