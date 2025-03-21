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
  DraxMonitorEventData,
} from "react-native-drax";

const randomColor = (): string => `#${Math.random().toString(16).slice(-6)}`;

export interface KanbanColumn<T> {
  id: string;
  data: T[];
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
    ({
      item,
      sourceColumnId,
      sourceIndex,
      destinationColumnId,
      destinationIndex,
    }: {
      item: T;
      sourceColumnId: string;
      sourceIndex: number;
      destinationColumnId: string;
      destinationIndex: number;
    }) => {
      onColumnChange?.(
        sourceColumnId,
        sourceIndex,
        destinationColumnId,
        destinationIndex,
        item
      );
      return DraxSnapbackTargetPreset.None;
    },
    [onColumnChange]
  );

  // Render a column
  const renderColumn = useCallback(
    (column: KanbanColumn<T>, columnIndex: number) => {
      const [isReceivingExternal, setIsReceivingExternal] = useState(false);

      // Track whether we're receiving from external source or internal reordering
      const handleReceiveDragEnter = useCallback(
        (event: DraxMonitorEventData) => {
          const isExternal = event.dragged.payload.columnId !== column.id;
          setIsReceivingExternal(isExternal);
        },
        [column.id]
      );

      // Reset when drag exits
      const handleReceiveDragExit = useCallback(() => {
        setIsReceivingExternal(false);
      }, []);

      // Create conditional styles based on drag source
      const getItemStyles = useCallback(
        (item: T) => {
          const index = column.data.indexOf(item);
          return {
            payload: {
              item,
              columnId: column.id,
              originalIndex: index,
              index,
            },
            ...(isReceivingExternal && {
              receivingStyle: {
                borderStyle: "dashed" as "dashed",
                borderColor: "#00ff00",
                borderRadius: 10,
                borderWidth: 1,
              },
            }),
          };
        },
        [isReceivingExternal, column.data, column.id]
      );

      return (
        <View key={column.id} onLayout={(e) => measureColumn(column.id, e)}>
          <DraxView
            draggable={false}
            receptive={false}
            monitoring={true}
            onMonitorDragEnter={handleReceiveDragEnter}
            onMonitorDragExit={handleReceiveDragExit}
            onMonitorDragDrop={handleReceiveDragExit}
            onMonitorDragEnd={handleReceiveDragExit}
            style={{ flexDirection: "row" }}
          >
            <DraxList
              id={column.id}
              horizontal={true}
              ref={(listRef) => {
                listRefs.current[column.id] = listRef;
              }}
              scrollEnabled={false}
              data={column.data}
              keyExtractor={(item, index) => getItemKey(item, index)}
              viewPropsExtractor={getItemStyles}
              renderItemContent={(info, props) => {
                const { item, index } = info;
                return renderItem(item, index, column.id);
              }}
              itemStyles={{
                style: {
                  width: 80,
                  height: 80,
                  borderRadius: 10,
                },
                hoverDraggingWithoutReceiverStyle: {
                  borderStyle: "dashed" as "dashed",
                  borderColor: "#ff0000",
                  borderRadius: 10,
                  borderWidth: 1,
                },
              }}
              onItemReorder={(data) => {
                return handleItemDragDrop({
                  item: data.fromItem,
                  sourceColumnId: column.id,
                  sourceIndex: data.fromIndex,
                  destinationColumnId: column.id,
                  destinationIndex: data.toIndex,
                });
              }}
              longPressDelay={longPressDelay}
            />

            <DraxView
              receptive={isReceivingExternal}
              draggable={false}
              style={{
                flex: 1,
                borderRadius: 10,
                minHeight: 80,
                minWidth: 80,
                // FIXME: match with item styles
              }}
              receivingStyle={{
                borderStyle: "dashed" as "dashed",
                borderColor: "#00ff00",
                borderRadius: 10,
                borderWidth: 1,
              }}
              payload={{
                columnId: column.id,
                index: column.data.length,
                originalIndex: column.data.length,
              }}
            />
          </DraxView>
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
        { flex: 1 },
        horizontal ? { flexDirection: "row" } : { flexDirection: "column" },
        // style,
      ]}
    >
      <DraxView
        style={{
          flex: 1,
          // gap: 8,
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
