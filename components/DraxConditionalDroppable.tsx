import { useCallback, useState } from "react";
import {
  DraxMonitorEventData,
  DraxView,
  DraxViewProps,
} from "react-native-drax";

interface DraxConditinalDroppableProps<Payload>
  extends Omit<DraxViewProps, "receptive"> {
  condition: (
    draggedPayload: { payload: Payload },
    receiver: { payload: Payload } | undefined
  ) => boolean;
}

function DraxConditinalDroppable<Payload>({
  condition,
  receivingStyle,
  ...props
}: DraxConditinalDroppableProps<Payload>) {
  const [receptive, setReceptive] = useState(false);

  const handleDragEnter = useCallback(
    (event: DraxMonitorEventData) => {
      setReceptive(condition(event.dragged, event.receiver));
    },
    [condition]
  );

  const handleDragEnd = useCallback(() => {
    setReceptive(false);
  }, []);

  return (
    <DraxView
      {...props}
      receptive={receptive}
      receivingStyle={receptive ? receivingStyle : undefined}
      onMonitorDragEnter={(event) => {
        handleDragEnter(event);
        props.onMonitorDragEnter?.(event);
      }}
      onMonitorDragEnd={(event) => {
        handleDragEnd();
        props.onMonitorDragEnd?.(event);
      }}
    />
  );
}

export default DraxConditinalDroppable;
