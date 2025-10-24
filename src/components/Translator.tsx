import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowRight, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export const Translator = () => {
  const [sourceCode, setSourceCode] = useState('');
  const [translatedCode, setTranslatedCode] = useState('');
  const [fromLanguage, setFromLanguage] = useState('java');
  const [toLanguage, setToLanguage] = useState('python');
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTranslate = async () => {
    if (!sourceCode.trim()) {
      toast.error('Please enter some code to translate');
      return;
    }

    if (fromLanguage === toLanguage) {
      toast.error('Please select different languages');
      return;
    }

    setIsTranslating(true);
    setTranslatedCode('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate-code`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            code: sourceCode,
            fromLanguage,
            toLanguage,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      setTranslatedCode(data.translatedCode);
      toast.success('Code translated successfully');
    } catch (error) {
      toast.error('Translation failed. Please try again.');
      console.error(error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(translatedCode);
      setCopied(true);
      toast.success('Code copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border bg-card shadow-card">
          <CardHeader>
            <CardTitle>Source Code</CardTitle>
            <CardDescription>Enter the code you want to translate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={fromLanguage} onValueChange={setFromLanguage}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="java">Java</SelectItem>
                <SelectItem value="c">C</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="cpp">C++</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Paste your code here..."
              value={sourceCode}
              onChange={(e) => setSourceCode(e.target.value)}
              className="min-h-[300px] font-mono text-sm bg-input border-border"
            />
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Translated Code</CardTitle>
                <CardDescription>AI-powered translation result</CardDescription>
              </div>
              {translatedCode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="border-border"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={toLanguage} onValueChange={setToLanguage}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="java">Java</SelectItem>
                <SelectItem value="c">C</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="cpp">C++</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Translation will appear here..."
              value={translatedCode}
              readOnly
              className="min-h-[300px] font-mono text-sm bg-input border-border"
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center">
        <Button 
          onClick={handleTranslate} 
          disabled={isTranslating}
          size="lg"
          className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
        >
          {isTranslating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Translating...
            </>
          ) : (
            <>
              <ArrowRight className="mr-2 h-5 w-5" />
              Translate Code
            </>
          )}
        </Button>
      </div>
    </div>
  );
};