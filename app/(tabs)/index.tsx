import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { DraxProvider, DraxView } from "react-native-drax";
import DraxKanban, { KanbanColumn } from "@/components/DraxKanban";
import { SafeAreaView } from "react-native-safe-area-context";

// Define interface for our task items
interface TaskItem {
  id: string;
  title: string;
  description: string;
}

// Sample data
const INITIAL_DATA: KanbanColumn<TaskItem>[] = [
  {
    id: "todo",
    title: "To Do",
    data: [
      {
        id: "task-1",
        title: "Research project",
        description: "Gather requirements and documentation",
      },
      {
        id: "task-2",
        title: "Design UI",
        description: "Create wireframes and mockups",
      },
      {
        id: "task-3",
        title: "Set up project",
        description: "Initialize repo and dependencies",
      },
    ],
  },
  {
    id: "in-progress",
    title: "In Progress",
    data: [
      {
        id: "task-4",
        title: "Implement login",
        description: "Create authentication flow",
      },
      {
        id: "task-5",
        title: "Create homepage",
        description: "Build landing page components",
      },
    ],
  },
  {
    id: "done",
    title: "Done",
    data: [
      {
        id: "task-6",
        title: "Setup testing",
        description: "Configure Jest and write initial tests",
      },
      {
        id: "task-7",
        title: "Project planning",
        description: "Define milestones and timeline",
      },
    ],
  },
];

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
          backgroundColor: "white",
          borderRadius: 10,
          padding: 12,
          marginVertical: 8,
          marginHorizontal: index === 0 ? 8 : 4,
          width: 80,
          height: 80,
        }}
        // draggingStyle={styles.draggingItem}
        // dragReleasedStyle={styles.draggingItem}
        // hoverDraggingStyle={styles.hoverDraggingItem}
        // receptive={true}
        // receivingStyle={styles.receivingItem}
        // payload={{ item, columnId, index }}
      >
        <Text style={styles.taskTitle}>{item.title}</Text>
      </View>
    );
  };

  return (
    <DraxProvider>
      <SafeAreaView style={styles.container}>
        <Text style={styles.header}>Kanban Board</Text>
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
      </SafeAreaView>
    </DraxProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#f8f9fa",
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
