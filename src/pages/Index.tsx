import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Analyzer } from '@/components/Analyzer';
import { Translator } from '@/components/Translator';
import { Code2, Languages } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(195_85%_55%/0.15),transparent_70%)]" />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <header className="mb-12 text-center space-y-4">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-card/50 border border-primary/20 backdrop-blur-sm shadow-glow">
            <Code2 className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ALGOAUDIT
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Analyze code complexity and translate between programming languages with AI precision
          </p>
        </header>

        <Tabs defaultValue="analyzer" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 bg-card/50 backdrop-blur-sm border border-border">
            <TabsTrigger value="analyzer" className="flex items-center gap-2">
              <Code2 className="w-4 h-4" />
              Analyzer
            </TabsTrigger>
            <TabsTrigger value="translator" className="flex items-center gap-2">
              <Languages className="w-4 h-4" />
              Translator
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="analyzer">
            <Analyzer />
          </TabsContent>
          
          <TabsContent value="translator">
            <Translator />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;