import React, { useCallback, ReactNode } from "react";
import { ViewStyle, StyleSheet, StyleProp, View } from "react-native";
import {
  DraxView,
  DraxList,
  DraxSnapbackTargetPreset,
  DraxViewStyleProps,
  DraxListProps,
} from "react-native-drax-2";

interface DraxRaggedArrayRowProps<T> {
  data: T[];
  rowIndex: number;
  renderItem: (item: T, index: number, rowIndex: number) => ReactNode;
  longPressDelay?: number;
  itemStyles?: DraxViewStyleProps;
  itemWidth: number;
  itemHeight: number;
  onItemChange?: ItemChangeHandler<T>;
  itemKeyExtractor?: (item: T, rowIndex: number, index: number) => string;
  style?: ViewStyle;
  ListHeaderComponent?: DraxListProps<T>["ListHeaderComponent"];
}

function DraxRaggedArrayRow<T>({
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
}: DraxRaggedArrayRowProps<T>) {
  const getItemKey = useCallback(
    (item: T, index: number) => {
      return itemKeyExtractor
        ? itemKeyExtractor(item, rowIndex, index)
        : `${rowIndex}-${index}`;
    },
    [itemKeyExtractor, rowIndex]
  );

  const handleItemDragDrop = useCallback(
    (props: ItemChangeHandlerProps<T>) => {
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
      onReceiveExternalItem={({ dragged, toIndex }) => {
        return handleItemDragDrop({
          source: {
            item: dragged.payload.item,
            index: dragged.payload.index,
            rowIndex: dragged.payload.rowIndex,
          },
          destination: {
            item: data[toIndex],
            index: toIndex,
            rowIndex,
          },
        });
      }}
      onItemReorder={({ fromIndex, toIndex }) => {
        return handleItemDragDrop({
          source: {
            item: data[fromIndex],
            index: fromIndex,
            rowIndex,
          },
          destination: {
            item: data[toIndex],
            index: toIndex,
            rowIndex,
          },
        });
      }}
      longPressDelay={longPressDelay}
      ListFooterComponent={<View style={{ minWidth: itemWidth }} />}
    />
  );
}

export interface DraxRaggedArrayCoordinate {
  rowIndex: number;
  index: number;
}

export interface ItemChangeHandlerProps<T> {
  source: DraxRaggedArrayCoordinate & { item: T | null };
  destination: DraxRaggedArrayCoordinate & { item: T | null };
}

export type ItemChangeHandler<T> = (props: ItemChangeHandlerProps<T>) => void;

export interface DraxRaggedArrayProps<T> {
  data: T[][];
  onItemChange?: ItemChangeHandler<T>;
  renderItem: (item: T, index: number, rowIndex: number) => ReactNode;
  itemKeyExtractor?: (item: T, rowIndex: number) => string;
  longPressDelay?: number;
  itemStyles?: DraxViewStyleProps;
  itemWidth: number;
  itemHeight: number;
  style?: StyleProp<ViewStyle>;
  rowStyle?: (rowIndex: number) => ViewStyle;
  rowHeaderComponent?: (
    rowIndex: number
  ) => DraxListProps<T>["ListHeaderComponent"];
  onDragStart?: () => void;
}

function DraxRaggedArray<T>({
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
  onDragStart,
}: DraxRaggedArrayProps<T>) {
  const renderRow = useCallback(
    (data: T[], rowIndex: number) => {
      return (
        <DraxRaggedArrayRow<T>
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
      draggable={false}
      monitoring={true}
      onMonitorDragStart={onDragStart}
      style={style}
    >
      {data.map(renderRow)}
      <DraxView
        // FIXME: add row header for new row placeholder?
        receptive={true}
        draggable={false}
        onReceiveDragDrop={(props) => {
          onItemChange?.({
            source: {
              item: props.dragged.payload.item,
              rowIndex: props.dragged.payload.rowIndex,
              index: props.dragged.payload.index,
            },
            destination: {
              item: null,
              rowIndex: data.length,
              index: 0,
            },
          });
          return DraxSnapbackTargetPreset.None;
        }}
        style={{
          flex: 1,
          minHeight: itemHeight,
        }}
        receivingStyle={itemStyles?.receivingStyle}
      />
    </DraxView>
  );
}

export default DraxRaggedArray;
