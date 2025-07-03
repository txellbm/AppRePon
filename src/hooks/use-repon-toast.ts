"use client";

import type { Toast } from "@/hooks/use-toast";
import { useCallback } from "react";

interface ReponToastProps extends Toast {
    audioText?: string;
}

export function useReponToast() {
    const toast = useCallback((_props: ReponToastProps) => {
        return { id: '', dismiss: () => {}, update: (_p: Toast) => {} };
    }, []);

    return { toast };
}
