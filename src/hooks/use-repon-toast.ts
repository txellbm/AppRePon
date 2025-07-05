"use client";

import type { Toast } from "@/hooks/use-toast";
import { toast as baseToast } from "@/hooks/use-toast";
import { useCallback } from "react";

interface ReponToastProps extends Toast {
    audioText?: string;
}

export function useReponToast() {
    const toast = useCallback((props: ReponToastProps) => {
        const { audioText, ...toastProps } = props;
        const result = baseToast(toastProps);
        return {
            id: result.id,
            dismiss: result.dismiss,
            update: (p: Toast) => result.update({ ...p, id: result.id }),
        };
    }, []);

    return { toast };
}
