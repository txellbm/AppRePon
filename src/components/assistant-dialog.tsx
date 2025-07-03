"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, Sparkles, User, Loader2, Bot } from "lucide-react";
import { type ConversationTurn } from "@/lib/types";
import useSpeechRecognition from "@/hooks/use-speech-recognition";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";


interface AssistantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommand: (command: string) => void;
  conversation: ConversationTurn[];
  assistantStatus: 'idle' | 'listening' | 'thinking';
}

export function AssistantDialog({ open, onOpenChange, onCommand, conversation, assistantStatus }: AssistantDialogProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { isListening, startListening, stopListening, isSupported } = useSpeechRecognition({
    onResult: (command) => {
      onCommand(command);
    }
  });

  // Auto-scroll to the bottom of the conversation
  useEffect(() => {
    if (scrollAreaRef.current) {
        // We need to access the viewport element within the ScrollArea component
        const scrollableViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (scrollableViewport) {
            scrollableViewport.scrollTop = scrollableViewport.scrollHeight;
        }
    }
  }, [conversation]);


  // Manage listening state based on assistant status
  useEffect(() => {
      if (assistantStatus === 'listening' && !isListening) {
          startListening();
      } else if (assistantStatus !== 'listening' && isListening) {
          stopListening();
      }
  }, [assistantStatus, isListening, startListening, stopListening]);

  const getStatusIndicator = () => {
    switch(assistantStatus) {
      case 'listening':
        return <div className="flex items-center justify-center gap-2 text-primary"><Mic className="h-4 w-4 animate-pulse" /><span>Escuchando...</span></div>;
      case 'thinking':
        return <div className="flex items-center justify-center gap-2 text-amber-500"><Loader2 className="h-4 w-4 animate-spin" /><span>Pensando...</span></div>;
      default:
        return <div className="flex items-center justify-center gap-2 text-muted-foreground"><Sparkles className="h-4 w-4" /><span>Dime qué necesitas...</span></div>;
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Sparkles className="text-primary"/> Asistente RePon</DialogTitle>
          <DialogDescription>
            Puedes hablar conmigo para gestionar tus listas.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow pr-4 -mr-4" ref={scrollAreaRef}>
           <div className="space-y-4">
            <AnimatePresence>
              {conversation.map((turn) => (
                  <motion.div
                    key={turn.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {turn.speaker === 'user' ? (
                       <div className="flex items-start gap-3 justify-end">
                          <div className="bg-primary text-primary-foreground p-3 rounded-lg rounded-br-none max-w-sm">
                              <p>{turn.text}</p>
                          </div>
                           <div className="bg-muted rounded-full p-2"><User className="h-5 w-5"/></div>
                      </div>
                    ) : (
                       <div className="flex items-start gap-3">
                           <div className="bg-muted rounded-full p-2"><Bot className="h-5 w-5 text-primary"/></div>
                           <div className="bg-card border p-3 rounded-lg rounded-bl-none max-w-sm">
                               <p>{turn.text}</p>
                           </div>
                       </div>
                    )}
                  </motion.div>
              ))}
            </AnimatePresence>
           </div>
        </ScrollArea>
        
        <DialogFooter className="flex-col gap-2 pt-4">
            <div className="text-center text-sm h-5 mb-2">
              {getStatusIndicator()}
            </div>
            <Button
              onClick={isListening ? stopListening : startListening}
              disabled={!isSupported || assistantStatus === 'thinking'}
              size="lg"
              className={cn("w-full transition-all duration-300", isListening && "bg-destructive hover:bg-destructive/90")}
            >
              <Mic className="mr-2"/>
              {isListening ? 'Dejar de escuchar' : 'Toca para hablar'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
