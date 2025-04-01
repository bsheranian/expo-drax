import * as React from "react";
import { Text, View, StyleSheet, SafeAreaView } from "react-native";

import { DraxList } from "react-native-drax-2";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const getBackgroundColor = (alphaIndex: number) => {
  switch (alphaIndex % 6) {
    case 0:
      return "#ffaaaa";
    case 1:
      return "#aaffaa";
    case 2:
      return "#aaaaff";
    case 3:
      return "#ffffaa";
    case 4:
      return "#ffaaff";
    case 5:
      return "#aaffff";
    default:
      return "#aaaaaa";
  }
};

const getItemStyleTweaks = (alphaItem: string) => {
  const alphaIndex = alphabet.indexOf(alphaItem);
  return {
    backgroundColor: getBackgroundColor(alphaIndex),
  };
};

const HomeScreen = () => {
  const [alphaData, setAlphaData] = React.useState(alphabet);

  return (
    <SafeAreaView style={styles.container}>
      <DraxList<string>
        data={alphaData}
        contentContainerStyle={{ gap: 80 }}
        renderItemContent={({ item }) => (
          <View style={[styles.alphaItem, getItemStyleTweaks(item)]}>
            <Text style={styles.alphaText}>{item}</Text>
          </View>
        )}
        onItemReorder={({ fromIndex, toIndex }) => {
          const newData = alphaData.slice();
          newData.splice(toIndex, 0, newData.splice(fromIndex, 1)[0]);
          setAlphaData(newData);
        }}
        keyExtractor={(item) => item}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, marginBottom: 83 },
  alphaItem: {
    height: 80,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  alphaText: {
    fontSize: 28,
  },
});

export default HomeScreen;
