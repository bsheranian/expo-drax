import React, { useCallback, ReactNode } from "react";
import { ViewStyle, StyleSheet, StyleProp, View } from "react-native";
import {
  DraxView,
  DraxList,
  DraxSnapbackTargetPreset,
  DraxViewStyleProps,
  DraxListProps,
} from "react-native-drax";
import DraxConditinalDroppable from "./DraxConditionalDroppable";

interface RaggedGridRowProps<T> {
  data: T[];
  rowIndex: number;
  renderItem: (item: T, index: number, rowIndex: number) => ReactNode;
  longPressDelay?: number;
  itemStyles?: DraxViewStyleProps;
  itemWidth: number;
  itemHeight: number;
  onItemChange?: ItemChangeHandler;
  itemKeyExtractor?: (item: T, rowIndex: number, index: number) => string;
  style?: ViewStyle;
  ListHeaderComponent?: DraxListProps<T>["ListHeaderComponent"];
}

function RaggedGridRow<T>({
  data,
  rowIndex,
  renderItem,
  longPressDelay,
  itemStyles = {},
  itemWidth,
  itemHeight,
  onItemChange,
  itemKeyExtractor,
  style = {},
  ListHeaderComponent,
}: RaggedGridRowProps<T>) {
  const getItemKey = useCallback(
    (item: T, index: number) => {
      return itemKeyExtractor
        ? itemKeyExtractor(item, rowIndex, index)
        : `${rowIndex}-${index}`;
    },
    [itemKeyExtractor, rowIndex]
  );

  const handleItemDragDrop = useCallback(
    (props: {
      source: RaggedGridCoordinate;
      destination: RaggedGridCoordinate;
    }) => {
      onItemChange?.(props);
      return DraxSnapbackTargetPreset.None;
    },
    [onItemChange]
  );

  const viewPropsExtractor = useCallback(
    (item: T) => {
      const index = data.indexOf(item);
      return {
        payload: {
          item,
          rowIndex,
          originalIndex: index,
          index,
        },
      };
    },
    [data, rowIndex]
  );

  return (
    <DraxList
      contentContainerStyle={[style, { flex: 1 }]}
      ListHeaderComponent={ListHeaderComponent}
      horizontal={true}
      scrollEnabled={false}
      data={data}
      keyExtractor={(item, index) => getItemKey(item, index)}
      viewPropsExtractor={viewPropsExtractor}
      renderItemContent={(info, props) => {
        const { item, index } = info;
        return renderItem(item, index, rowIndex);
      }}
      itemStyles={{
        ...itemStyles,
        style: {
          ...StyleSheet.flatten(itemStyles.style || {}),
          width: itemWidth,
          height: itemHeight,
        },
      }}
      allowReceivingExternalItems={true}
      onReceiveExternalItem={(props) => {
        return handleItemDragDrop({
          source: {
            index: props.dragged.payload.index,
            rowIndex: props.dragged.payload.rowIndex,
          },
          destination: {
            index: props.receiver.payload.index,
            rowIndex: props.receiver.payload.rowIndex,
          },
        });
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
          draggable={false}
          style={{
            flex: 1,
            minWidth: itemWidth,
          }}
          receivingStyle={itemStyles.receivingStyle}
          payload={{
            rowIndex,
            index: data.length,
            originalIndex: data.length,
          }}
        />
      }
    />
  );
}

interface RaggedGridCoordinate {
  rowIndex: number;
  index: number;
}

export type ItemChangeHandler = (props: {
  source: RaggedGridCoordinate;
  destination: RaggedGridCoordinate;
}) => void;

export interface RaggedGridProps<T> {
  data: T[][];
  onItemChange?: ItemChangeHandler;
  renderItem: (item: T, index: number, rowIndex: number) => ReactNode;
  itemKeyExtractor?: (item: T, rowIndex: number) => string;
  longPressDelay?: number;
  itemStyles: DraxViewStyleProps;
  itemWidth: number;
  itemHeight: number;
  style?: StyleProp<ViewStyle>;
  rowStyle?: (rowIndex: number) => ViewStyle;
  rowHeaderComponent?: (
    rowIndex: number
  ) => DraxListProps<T>["ListHeaderComponent"];
}

function RaggedGrid<T>({
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
}: RaggedGridProps<T>) {
  const renderRow = useCallback(
    (data: T[], rowIndex: number) => {
      return (
        <RaggedGridRow<T>
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
    <View style={style}>
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
    </View>
  );
}

export default RaggedGrid;
