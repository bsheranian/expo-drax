import React, { useState, useCallback, ReactNode } from "react";
import { ViewStyle, StyleSheet, StyleProp } from "react-native";
import {
  DraxView,
  DraxList,
  DraxSnapbackTargetPreset,
  DraxMonitorEventData,
  DraxViewStyleProps,
  DraxListProps,
} from "react-native-drax";
import DraxConditinalDroppable from "./DraxConditionalDroppable";

interface KanbanRowProps<T> {
  data: T[];
  rowIndex: number;
  renderItem: (item: T, index: number, rowIndex: number) => ReactNode;
  longPressDelay?: number;
  itemStyles?: DraxViewStyleProps;
  itemWidth: ViewStyle["width"];
  itemHeight: ViewStyle["height"];
  onItemChange?: ItemChangeHandler;
  itemKeyExtractor?: (item: T, rowIndex: number, index: number) => string;
  style?: StyleProp<ViewStyle>;
  ListHeaderComponent?: DraxListProps<T>["ListHeaderComponent"];
}

function KanbanRow<T>({
  data,
  rowIndex,
  renderItem,
  longPressDelay,
  itemStyles = {},
  itemWidth,
  itemHeight,
  onItemChange,
  itemKeyExtractor,
  style,
  ListHeaderComponent,
}: KanbanRowProps<T>) {
  const [isReceivingExternal, setIsReceivingExternal] = useState(false);

  const { receivingStyle, ...itemStyleProps } = itemStyles;

  const handleReceiveDragEnter = useCallback(
    (event: DraxMonitorEventData) => {
      const isExternal = event.dragged.payload.rowIndex !== rowIndex;
      setIsReceivingExternal(isExternal);
    },
    [rowIndex]
  );

  const handleReceiveDragExit = useCallback(() => {
    setIsReceivingExternal(false);
  }, []);

  const getItemKey = useCallback(
    (item: T, index: number) => {
      return itemKeyExtractor
        ? itemKeyExtractor(item, rowIndex, index)
        : `${rowIndex}-${index}`;
    },
    [itemKeyExtractor, rowIndex]
  );

  const handleItemDragDrop = useCallback(
    (props: { source: KanbanCoordinate; destination: KanbanCoordinate }) => {
      onItemChange?.(props);
      return DraxSnapbackTargetPreset.None;
    },
    [onItemChange]
  );

  const getItemStyles = useCallback(
    (item: T) => {
      const index = data.indexOf(item);
      return {
        payload: {
          item,
          rowIndex,
          originalIndex: index,
          index,
        },
        ...(isReceivingExternal && {
          receivingStyle: receivingStyle,
        }),
      };
    },
    [isReceivingExternal, data, rowIndex, receivingStyle]
  );

  return (
    <DraxView
      draggable={false}
      receptive={false}
      monitoring={true}
      onMonitorDragEnter={handleReceiveDragEnter}
      onMonitorDragExit={handleReceiveDragExit}
      onMonitorDragDrop={handleReceiveDragExit}
      onMonitorDragEnd={handleReceiveDragExit}
    >
      <DraxList
        contentContainerStyle={[style, { flex: 1 }]}
        ListHeaderComponent={ListHeaderComponent}
        horizontal={true}
        scrollEnabled={false}
        data={data}
        keyExtractor={(item, index) => getItemKey(item, index)}
        viewPropsExtractor={getItemStyles}
        renderItemContent={(info, props) => {
          const { item, index } = info;
          return renderItem(item, index, rowIndex);
        }}
        itemStyles={{
          ...itemStyleProps,
          style: {
            ...StyleSheet.flatten(itemStyleProps.style || {}),
            width: itemWidth,
            height: itemHeight,
          },
        }}
        onItemReorder={(data) => {
          return handleItemDragDrop({
            source: {
              index: data.fromIndex,
              rowIndex,
            },
            destination: {
              index: data.toIndex,
              rowIndex,
            },
          });
        }}
        longPressDelay={longPressDelay}
        ListFooterComponentStyle={{ flex: 1 }}
        ListFooterComponent={
          <DraxView
            receptive={isReceivingExternal}
            draggable={false}
            style={{
              flex: 1,
              minWidth: itemWidth,
            }}
            receivingStyle={receivingStyle}
            payload={{
              rowIndex,
              index: data.length,
              originalIndex: data.length,
            }}
          />
        }
      />
    </DraxView>
  );
}

interface KanbanCoordinate {
  rowIndex: number;
  index: number;
}

export type ItemChangeHandler = (props: {
  source: KanbanCoordinate;
  destination: KanbanCoordinate;
}) => void;

export interface DraxKanbanProps<T> {
  data: T[][];
  onItemChange?: ItemChangeHandler;
  renderItem: (item: T, index: number, rowIndex: number) => ReactNode;
  itemKeyExtractor?: (item: T, rowIndex: number) => string;
  longPressDelay?: number;
  itemStyles: DraxViewStyleProps;
  itemWidth: ViewStyle["width"];
  itemHeight: ViewStyle["height"];
  style?: StyleProp<ViewStyle>;
  rowStyle?: (rowIndex: number) => StyleProp<ViewStyle>;
  rowHeaderComponent?: (
    rowIndex: number
  ) => DraxListProps<T>["ListHeaderComponent"];
}

function DraxKanban<T>({
  data,
  onItemChange,
  renderItem,
  itemKeyExtractor,
  longPressDelay,
  itemStyles,
  itemWidth,
  itemHeight,
  style,
  rowStyle,
  rowHeaderComponent,
}: DraxKanbanProps<T>) {
  const renderRow = useCallback(
    (data: T[], rowIndex: number) => {
      return (
        <KanbanRow<T>
          key={`row-${rowIndex}`}
          data={data}
          rowIndex={rowIndex}
          itemKeyExtractor={itemKeyExtractor}
          renderItem={renderItem}
          itemStyles={itemStyles}
          longPressDelay={longPressDelay}
          onItemChange={onItemChange}
          itemWidth={itemWidth}
          itemHeight={itemHeight}
          style={rowStyle?.(rowIndex)}
          ListHeaderComponent={rowHeaderComponent?.(rowIndex)}
        />
      );
    },
    [
      renderItem,
      longPressDelay,
      onItemChange,
      itemStyles,
      itemWidth,
      itemHeight,
      rowStyle,
      rowHeaderComponent,
    ]
  );

  return (
    <DraxView
      style={style}
      draggable={false}
      receptive={false}
      monitoring={true}
      onMonitorDragDrop={(monitorEvent) => {
        const { dragged, receiver } = monitorEvent;

        if (dragged?.payload && receiver?.payload) {
          const sourcerowIndex = dragged.payload.rowIndex;
          const sourceIndex = dragged.payload.index;
          const destinationrowIndex = receiver.payload.rowIndex;
          const destinationIndex = receiver.payload.index;

          // Only handle cross-row moves
          if (sourcerowIndex !== destinationrowIndex) {
            onItemChange?.({
              source: {
                index: sourceIndex,
                rowIndex: sourcerowIndex,
              },
              destination: {
                index: destinationIndex,
                rowIndex: destinationrowIndex,
              },
            });
          }
        }

        return undefined;
      }}
    >
      {data.map(renderRow)}
      <DraxConditinalDroppable<{ rowIndex: number }>
        draggable={false}
        style={{
          flex: 1,
          minHeight: itemHeight,
        }}
        receivingStyle={itemStyles.receivingStyle}
        payload={{
          rowIndex: data.length,
          index: 0,
          originalIndex: 0,
        }}
        condition={(dragged) => {
          return (
            dragged.payload.rowIndex !== data.length - 1 ||
            data[dragged.payload.rowIndex].length > 1
          );
        }}
      />
    </DraxView>
  );
}

export default DraxKanban;
