import React, {
  useState,
  useCallback,
  useRef,
  ReactNode,
  ForwardedRef,
  forwardRef,
} from "react";
import {
  View,
  ViewStyle,
  StyleProp,
  LayoutChangeEvent,
  findNodeHandle,
  FlatList,
} from "react-native";
import {
  DraxView,
  DraxList,
  DraxSnapbackTargetPreset,
  DraxViewMeasurements,
  DraxListOnItemDragEndEventData,
} from "react-native-drax";

export interface KanbanColumn<T> {
  id: string;
  title?: string;
  data: T[];
  renderTitle?: () => ReactNode;
}

export interface DraxKanbanProps<T> {
  columns: KanbanColumn<T>[];
  onColumnChange?: (
    sourceColumnId: string,
    sourceIndex: number,
    destinationColumnId: string,
    destinationIndex: number,
    item: T
  ) => void;
  renderItem: (item: T, index: number, columnId: string) => ReactNode;
  style?: StyleProp<ViewStyle>;
  columnStyle?: StyleProp<ViewStyle>;
  listStyle?: StyleProp<ViewStyle>;
  listContainerStyle?: StyleProp<ViewStyle>;
  horizontal?: boolean;
  itemKeyExtractor?: (item: T, index: number) => string;
  longPressDelay?: number;
}

interface InternalDragItem<T> {
  item: T;
  columnId: string;
  index: number;
}

function DraxKanbanWithRef<T>(
  {
    columns,
    onColumnChange,
    renderItem,
    style,
    columnStyle,
    listStyle,
    listContainerStyle,
    horizontal = false,
    itemKeyExtractor,
    longPressDelay,
  }: DraxKanbanProps<T>,
  ref: ForwardedRef<View>
) {
  // Store refs to each DraxList
  const listRefs = useRef<Record<string, FlatList<T> | null>>({});

  // Store measurements of each column
  const [columnMeasurements, setColumnMeasurements] = useState<
    Record<string, DraxViewMeasurements>
  >({});

  // Root node handle for measuring
  const rootNodeHandleRef = useRef<number | null>(null);

  // Measure a column when it renders
  const measureColumn = useCallback(
    (columnId: string, event: LayoutChangeEvent) => {
      const { width, height, x, y } = event.nativeEvent.layout;
      setColumnMeasurements((prev) => ({
        ...prev,
        [columnId]: { width, height, x, y },
      }));
    },
    []
  );

  // No need for a separate handler function as we're directly handling events in the component;

  // Get a key for each item in the list
  const getItemKey = useCallback(
    (item: T, index: number) => {
      return itemKeyExtractor
        ? itemKeyExtractor(item, index)
        : index.toString();
    },
    [itemKeyExtractor]
  );

  // Set ref to node handle for measurement
  const setRootRef = useCallback(
    (node: View | null) => {
      if (node) {
        rootNodeHandleRef.current = findNodeHandle(node);

        // Forward the ref if provided
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }
    },
    [ref]
  );

  // Handle when an item is dragged between columns or reordered within a column
  const handleItemDragDrop = useCallback(
    (
      sourceColumnId: string,
      data: DraxListOnItemDragEndEventData<T> | undefined,
      itemPayload: InternalDragItem<T>
    ) => {
      if (!data) {
        console.log("No data!!!!!!!");
        return;
      }
      // Get the destination column and index
      const { receiver } = data;

      if (!receiver) {
        console.log("No receiver!!!!!!!");
        return;
      }
      const destinationColumnId = receiver.payload.columnId;
      const destinationIndex = receiver.payload.index;

      // Call the onColumnChange callback
      if (
        onColumnChange &&
        (sourceColumnId !== destinationColumnId ||
          itemPayload.index !== destinationIndex)
      ) {
        onColumnChange(
          sourceColumnId,
          itemPayload.index,
          destinationColumnId,
          destinationIndex,
          itemPayload.item
        );
      }

      // Prevent default snapback for items dropped on a receiver
      return DraxSnapbackTargetPreset.None;
    },
    [onColumnChange]
  );

  // Render a column
  const renderColumn = useCallback(
    (column: KanbanColumn<T>, columnIndex: number) => {
      return (
        <View
          key={column.id}
          style={[
            {
              //   margin: 8,
              borderRadius: 8,
              backgroundColor: "#aaffaa",
              //   overflow: "hidden",
            },
          ]}
          onLayout={(e) => measureColumn(column.id, e)}
        >
          <DraxList
            horizontal={true}
            ref={(listRef) => {
              listRefs.current[column.id] = listRef;
            }}
            //   style={listStyle}
            //   flatListStyle={listContainerStyle}
            data={column.data}
            keyExtractor={(item, index) => getItemKey(item, index)}
            renderItemContent={(info, props) => {
              const { item, index } = info;
              // Render with provided renderItem function
              return renderItem(item, index, column.id);
            }}
            //   onItemDragStart={() => {
            //     // Optional logic when drag starts
            //   }}
            onItemReorder={() => {
              // We'll handle reordering in onMonitorDragDrop to support cross-list dragging
            }}
            longPressDelay={longPressDelay}
            // Listen for drag drops through monitor callbacks on parent view
            onItemDragEnd={(data) => {
              // Check if the dragged item belongs to this column and was dropped on a receiver
              if (
                data.receiver &&
                data.dragged.payload?.columnId === column.id
              ) {
                return handleItemDragDrop(
                  column.id,
                  data,
                  data.dragged.payload as InternalDragItem<T>
                );
              }
              return undefined;
            }}
            // // Create a payload that includes the column id and item
            viewPropsExtractor={(item) => {
              const index = column.data.indexOf(item);
              return {
                payload: {
                  item,
                  columnId: column.id,
                  originalIndex: index,
                  index,
                },
              };
            }}
          />
        </View>
      );
    },
    [
      columnStyle,
      listStyle,
      listContainerStyle,
      renderItem,
      getItemKey,
      longPressDelay,
      onColumnChange,
    ]
  );

  return (
    <View
      ref={setRootRef}
      style={[
        {
          flex: 1,
          backgroundColor: "#ffaaaa",
        },
        horizontal ? { flexDirection: "row" } : { flexDirection: "column" },
        // style,
      ]}
    >
      <DraxView
        style={{
          flex: 1,
          gap: 8,
        }}
        draggable={false}
        receptive={false}
        monitoring={true}
        onMonitorDragDrop={(monitorEvent) => {
          // Handle cross-list drag and drop detection here
          const { dragged, receiver } = monitorEvent;

          if (dragged?.payload && receiver?.payload) {
            const sourceColumnId = dragged.payload.columnId;
            const sourceIndex = dragged.payload.index;
            const sourceItem = dragged.payload.item;
            const destColumnId = receiver.payload.columnId;
            const destIndex = receiver.payload.index;

            // Only handle cross-column moves
            if (sourceColumnId !== destColumnId && onColumnChange) {
              onColumnChange(
                sourceColumnId,
                sourceIndex,
                destColumnId,
                destIndex,
                sourceItem
              );
            }
          }

          return undefined;
        }}
      >
        {columns.map(renderColumn)}
      </DraxView>
    </View>
  );
}

// Use forwardRef to be able to forward the ref to the root View
export const DraxKanban = forwardRef(DraxKanbanWithRef) as <T>(
  props: DraxKanbanProps<T> & { ref?: ForwardedRef<View> }
) => ReactNode;

export default DraxKanban;
