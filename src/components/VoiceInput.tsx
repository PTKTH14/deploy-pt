import React, { useState, useEffect, useCallback } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface VoiceInputProps {
  onResult: (text: string) => void;
  onError?: (error: string) => void;
  isListening?: boolean;
  tooltip?: string;
  variant?: 'default' | 'ghost' | 'outline';
  className?: string;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onResult,
  onError,
  isListening: externalIsListening,
  tooltip = 'พูดเพื่อสั่งงาน (Ctrl+M)',
  variant = 'outline',
  className = '',
}) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize Web Speech API
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = 'th-TH';

        recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
          const result = event.results[0][0].transcript;
          onResult(result);
          setIsListening(false);
        };

        recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
          let errorMessage = 'เกิดข้อผิดพลาดในการรับเสียง';
          if (event.error === 'not-allowed') {
            errorMessage = 'กรุณาอนุญาตการใช้งานไมโครโฟน';
          } else if (event.error === 'no-speech') {
            errorMessage = 'ไม่ได้ยินเสียง กรุณาลองใหม่';
          } else if (event.error === 'network') {
            errorMessage = 'ไม่สามารถเชื่อมต่อได้ กรุณาตรวจสอบอินเทอร์เน็ต';
          }
          onError?.(errorMessage);
          setIsListening(false);
        };

        recognitionInstance.onend = () => {
          setIsListening(false);
        };

        setRecognition(recognitionInstance);
      } else {
        onError?.('เบราว์เซอร์ของคุณไม่รองรับการสั่งงานด้วยเสียง');
      }
    }

    // Cleanup recognition on unmount
    return () => {
      if (recognition) {
        recognition.abort();
      }
    };
  }, [onResult, onError]);

  // Handle keyboard shortcut (Ctrl+M)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'm') {
        e.preventDefault();
        toggleListening();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recognition]);

  const toggleListening = useCallback(() => {
    if (!recognition) return;
    
    if (isListening) {
      recognition.abort();
      setIsListening(false);
    } else {
      try {
        recognition.start();
        setIsListening(true);
      } catch (error) {
        onError?.('เกิดข้อผิดพลาดในการเริ่มการรับเสียง');
      }
    }
  }, [recognition, isListening, onError]);

  // Use external isListening state if provided
  const actualIsListening = externalIsListening ?? isListening;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size="icon"
            className={`${className} relative`}
            onClick={toggleListening}
          >
            {actualIsListening ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="absolute w-2 h-2 bg-red-500 rounded-full top-1 right-1" />
              </>
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}; 