"use client";

import { useToast } from "@/hooks/use-toast";
import { useAudio } from "@/providers/audio-provider";
import type { Toast } from "@/hooks/use-toast";
import { useCallback } from "react";

interface ReponToastProps extends Toast {
    audioText?: string;
}

export function useReponToast(options?: { audioDisabled?: boolean }) {
    const { toast: originalToast } = useToast();
    const { playAudio } = useAudio();

    const toast = useCallback((props: ReponToastProps) => {
        const { audioText, ...toastProps } = props;
        const textToPlay = audioText || props.title as string || props.description as string;

        if (textToPlay && !options?.audioDisabled) {
            playAudio(textToPlay);
        }
        
        return originalToast(toastProps);
    }, [originalToast, playAudio, options?.audioDisabled]);

    return { toast };
}
