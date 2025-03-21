import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { DraxProvider } from "react-native-drax";
import DraxKanban, { KanbanColumn } from "@/components/DraxKanban";
import { SafeAreaView } from "react-native-safe-area-context";

const randomColor = (): string => `#${Math.random().toString(16).slice(-6)}`;

// Define interface for our task items
interface TaskItem {
  id: string;
  title: string;
}

const data = [
  "ABCDEF",
  "IJKLMNOP",
  "QRSTUVWX",
  "YZ",
  "123456",
  "7890",
  "&*()",
  "!@#$%^",
];

// Sample data
const INITIAL_DATA: KanbanColumn<TaskItem>[] = data.map((item, index) => ({
  id: `${index}`,
  data: item.split("").map((item) => {
    return {
      id: item,
      title: item,
    };
  }),
}));

const KanbanExample = () => {
  // State to manage our kanban board data
  const [columns, setColumns] =
    useState<KanbanColumn<TaskItem>[]>(INITIAL_DATA);

  // Handle moving items between columns
  const handleColumnChange = (
    sourceColumnId: string,
    sourceIndex: number,
    destinationColumnId: string,
    destinationIndex: number,
    item: TaskItem
  ) => {
    // Create a deep copy of the columns array to work with
    const newColumns = [
      ...columns.map((col) => ({
        ...col,
        data: [...col.data],
      })),
    ];

    // Find source and destination columns
    const sourceColumn = newColumns.find((col) => col.id === sourceColumnId);
    const destColumn = newColumns.find((col) => col.id === destinationColumnId);

    if (!sourceColumn || !destColumn) return;

    // Remove from source column
    const [removed] = sourceColumn.data.splice(sourceIndex, 1);

    // Add to destination column
    destColumn.data.splice(destinationIndex, 0, removed);

    // Update state - using setTimeout to improve animation flow
    // This helps ensure the animation is smoother by letting the UI update first
    setTimeout(() => {
      setColumns(newColumns);
    }, 0);
  };

  // Render a task item
  const renderTaskItem = (item: TaskItem, index: number, columnId: string) => {
    return (
      <View
        style={{
          padding: 12,
          flex: 1,
          borderRadius: 10,
          backgroundColor: "#fafafa",
          borderWidth: 1,
          borderColor: "#ddd",
        }}
      >
        <Text style={styles.taskTitle}>
          {item.title}-{columnId}-{index}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Kanban Board</Text>
      <ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <DraxProvider>
            <DraxKanban
              columns={columns}
              onColumnChange={handleColumnChange}
              renderItem={renderTaskItem}
              // style={styles.kanban}
              // columnStyle={styles.column}
              // listContainerStyle={styles.list}
              itemKeyExtractor={(item) => item.id}
              longPressDelay={150} // Make items draggable after holding for 150ms
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
    backgroundColor: "#777777",
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
