"use client";

import * as React from "react";

import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

const TOAST_LIMIT: number = 1;
const TOAST_REMOVE_DELAY: number = 1000000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

let count: number = 0;

function genId(): string {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type Action =
  | { type: "ADD_TOAST"; toast: ToasterToast }
  | { type: "UPDATE_TOAST"; toast: Partial<ToasterToast> }
  | { type: "DISMISS_TOAST"; toastId?: ToasterToast["id"] }
  | { type: "REMOVE_TOAST"; toastId?: ToasterToast["id"] };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };

// Declare dispatch type first. Disable prefer-const as it's assigned later.
// eslint-disable-next-line prefer-const -- Declared early, assigned later due to functional dependencies.
let dispatch: (action: Action) => void;

// Define addToRemoveQueue - safe to reference dispatch type here
const addToRemoveQueue = (toastId: string): void => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout: ReturnType<typeof setTimeout> = setTimeout(() => {
    toastTimeouts.delete(toastId);
    // dispatch() call is deferred via setTimeout, ensuring it's assigned by then.
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

// Define reducer - safe to reference addToRemoveQueue here
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t: ToasterToast) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;
      // Call addToRemoveQueue for side effect
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast: ToasterToast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t: ToasterToast) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter(
          (t: ToasterToast) => t.id !== action.toastId
        ),
      };
  }
};

// Assign the actual function implementation to dispatch now that reducer is defined
dispatch = (action: Action): void => {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener: (state: State) => void) => {
    listener(memoryState);
  });
};

// --- Rest of the hook logic ---

type Toast = Omit<ToasterToast, "id">;

interface ToastReturn {
  id: string;
  dismiss: () => void;
  update: (props: Partial<ToasterToast>) => void;
}

function toast({ ...props }: Toast): ToastReturn {
  const id: string = genId();

  const update = (updateProps: Partial<ToasterToast>): void =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...updateProps, id },
    });
  const dismiss = (): void => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open: boolean) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

interface UseToastReturn extends State {
  toast: (props: Toast) => ToastReturn;
  dismiss: (toastId?: string) => void;
}

function useToast(): UseToastReturn {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index: number = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []); // Keep empty dependency array

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { useToast, toast };
