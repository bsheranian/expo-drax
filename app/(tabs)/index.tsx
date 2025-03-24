import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { DraxProvider } from "react-native-drax";
import DraxKanban, { ItemChangeHandler } from "@/components/DraxKanban";
import { SafeAreaView } from "react-native-safe-area-context";

const randomColor = (): string => `#${Math.random().toString(16).slice(-6)}`;

// Define interface for our task items
interface TaskItem {
  id: string;
  title: string;
}

const data = [
  "ABCDEFGH",
  "IJKLMNOP",
  "QRSTUVWX",
  "YZ",
  "123456",
  "7890",
  "!@#$%^",
  "&*()-+",
  "{}[]/\\",
];

// Sample data
const INITIAL_DATA: TaskItem[][] = data.map((item, index) =>
  item.split("").map((item) => {
    return {
      id: item,
      title: item,
    };
  })
);

const KanbanExample = () => {
  const [lists, setLists] = useState<TaskItem[][]>(INITIAL_DATA);

  const handleItemChange: ItemChangeHandler = ({ source, destination }) => {
    // Create a deep copy of the columns array to work with
    const newLists: TaskItem[][] = [...lists.map((list) => [...list])];

    if (destination.rowIndex === newLists.length) {
      newLists.push([]);
    }

    const sourceColumn = newLists[source.rowIndex];
    const destColumn = newLists[destination.rowIndex];

    if (!sourceColumn || !destColumn) return;

    const [removed] = sourceColumn.splice(source.index, 1);

    destColumn.splice(destination.index, 0, removed);

    setLists(newLists.filter((list) => !!list.length));
  };

  const renderTaskItem = (item: TaskItem, index: number, rowIndex: number) => {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={styles.taskTitle}>{item.title}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Planogram</Text>
      <ScrollView>
        <ScrollView
          pinchGestureEnabled // FIXME: figure out how to enable pinch to zoom
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <DraxProvider>
            <DraxKanban
              style={{ padding: 8, gap: 8 }}
              rowStyle={(rowIndex) => ({
                gap: 8,
                padding: 8,
              })}
              itemStyles={{
                style: {
                  borderRadius: 10,
                  backgroundColor: "#ffa",
                },
                receivingStyle: {
                  borderRadius: 10,
                  backgroundColor: "#afa",
                },
                hoverDraggingWithoutReceiverStyle: {
                  backgroundColor: "#faa",
                },
              }}
              data={lists}
              renderItem={renderTaskItem}
              onItemChange={handleItemChange}
              itemKeyExtractor={(item) => item.id}
              longPressDelay={150}
              itemWidth={50}
              itemHeight={50}
              rowHeaderComponent={(rowIndex) => (
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    backgroundColor: "#afa",
                    padding: 8,
                    borderRadius: 10,
                  }}
                >
                  <Text>Row {rowIndex}</Text>
                </View>
              )}
            />
          </DraxProvider>
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ddd",
    paddingBottom: 50,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  kanban: {
    flex: 1,
  },
  hoverDraggingItem: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 8,
  },
  receivingItem: {
    backgroundColor: "#f0f8ff", // Light blue highlight when receiving
    borderColor: "#4a90e2",
    borderWidth: 2,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: "#666",
  },
});

export default KanbanExample;
