import React from "react";
import { View, FlatList, useWindowDimensions } from "react-native";
import PlatilloCard from "../components/PlatilloCard";
import platillos from "../components/platillos";

export default function HomeScreen({ navigation }) {
  const { width, height } = useWindowDimensions();
  const numColumns = width > height ? 2 : 1; // 2 columnas en horizontal, 1 en vertical

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <FlatList
        data={platillos}
        key={numColumns} // refresca layout al rotar
        numColumns={numColumns}
        renderItem={({ item }) => (
          <PlatilloCard
            platillo={item}
            onPress={() => navigation.navigate("Detalles", { platillo: item })}
          />
        )}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
}
