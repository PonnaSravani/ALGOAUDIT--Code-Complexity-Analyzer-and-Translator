import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Loader2, Code2, TrendingUp, FileCode, Sparkles, Copy, Check } from 'lucide-react';
import { analyzeCode, CodeMetrics } from '@/utils/codeAnalysis';
import { toast } from 'sonner';

const COLORS = {
  excellent: 'hsl(140 65% 50%)',
  good: 'hsl(195 85% 55%)',
  fair: 'hsl(40 90% 55%)',
  poor: 'hsl(0 70% 55%)'
};

export const Analyzer = () => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('java');
  const [metrics, setMetrics] = useState<CodeMetrics | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [optimizedCode, setOptimizedCode] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleAnalyze = async () => {
    if (!code.trim()) {
      toast.error('Please enter some code to analyze');
      return;
    }

    setIsAnalyzing(true);
    setOptimizedCode('');
    await new Promise(resolve => setTimeout(resolve, 800));
    
    try {
      const result = analyzeCode(code, language);
      setMetrics(result);
      toast.success('Code analyzed successfully');
      
      // Automatically generate optimized code
      await generateOptimizedCode(result);
    } catch (error) {
      toast.error('Analysis failed');
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateOptimizedCode = async (analysisMetrics: CodeMetrics) => {
    setIsOptimizing(true);
    
    const prompt = `Given this ${language} code with the following analysis:
- Cyclomatic Complexity: ${analysisMetrics.cyclomaticComplexity}
- Max Nesting Depth: ${analysisMetrics.nestingDepth}
- Comment Density: ${analysisMetrics.commentDensity}%
- Quality Rating: ${analysisMetrics.qualityRating}

Issues identified:
${analysisMetrics.recommendations.join('\n')}

Original code:
\`\`\`${language}
${code}
\`\`\`

Please provide an optimized version of this code that:
1. Reduces complexity and nesting where possible
2. Improves readability and maintainability
3. Adds meaningful comments
4. Follows ${language} best practices
5. Preserves the original functionality

Return ONLY the optimized code without explanations.`;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: prompt }]
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Optimization failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let optimized = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const json = JSON.parse(line.slice(6));
                const content = json.choices?.[0]?.delta?.content;
                if (content) {
                  optimized += content;
                  setOptimizedCode(optimized);
                }
              } catch (e) {
                // Ignore parse errors for partial chunks
              }
            }
          }
        }
      }

      toast.success('Optimized code generated successfully');
    } catch (error) {
      toast.error('Failed to generate optimized code');
      console.error(error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(optimizedCode);
      setCopied(true);
      toast.success('Optimized code copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  const barData = metrics ? [
    { name: 'LOC', value: metrics.linesOfCode },
    { name: 'Complexity', value: metrics.cyclomaticComplexity },
    { name: 'Nesting', value: metrics.nestingDepth },
    { name: 'Comments %', value: metrics.commentDensity },
  ] : [];

  const pieData = metrics ? [
    { name: 'Volume', value: metrics.halsteadMetrics.volume },
    { name: 'Difficulty', value: metrics.halsteadMetrics.difficulty * 100 },
    { name: 'Effort', value: metrics.halsteadMetrics.effort / 100 },
  ] : [];

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-primary" />
            <CardTitle>Code Input</CardTitle>
          </div>
          <CardDescription>Paste your code and select the language</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={language} onValueChange={setLanguage}>
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
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="min-h-[200px] font-mono text-sm bg-input border-border"
          />
          <Button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing}
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <TrendingUp className="mr-2 h-4 w-4" />
                Analyze Code
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {metrics && (
        <>
          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-primary" />
                  <CardTitle>Quality Rating</CardTitle>
                </div>
                <Badge 
                  className="text-sm px-3 py-1"
                  style={{ 
                    backgroundColor: COLORS[metrics.qualityRating],
                    color: 'hsl(220 20% 12%)'
                  }}
                >
                  {metrics.qualityRating.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Lines of Code</p>
                  <p className="text-3xl font-bold text-primary">{metrics.linesOfCode}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Cyclomatic Complexity</p>
                  <p className="text-3xl font-bold text-accent">{metrics.cyclomaticComplexity}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Max Nesting Depth</p>
                  <p className="text-3xl font-bold text-info">{metrics.nestingDepth}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Comment Density</p>
                  <p className="text-3xl font-bold text-success">{metrics.commentDensity}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border bg-card shadow-card">
              <CardHeader>
                <CardTitle>Code Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 25%)" />
                    <XAxis dataKey="name" stroke="hsl(210 40% 98%)" />
                    <YAxis stroke="hsl(210 40% 98%)" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(220 18% 16%)', 
                        border: '1px solid hsl(220 15% 25%)',
                        borderRadius: '0.5rem'
                      }} 
                    />
                    <Bar dataKey="value" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(195 85% 55%)" />
                        <stop offset="100%" stopColor="hsl(280 65% 60%)" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-card">
              <CardHeader>
                <CardTitle>Halstead Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['hsl(195 85% 55%)', 'hsl(280 65% 60%)', 'hsl(140 65% 50%)'][index % 3]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(220 18% 16%)', 
                        border: '1px solid hsl(220 15% 25%)',
                        borderRadius: '0.5rem'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border bg-card shadow-card">
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>Improve your code quality with these suggestions</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {metrics.recommendations.map((rec, index) => (
                  <li key={index} className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-primary">{index + 1}</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{rec}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-card relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <CardTitle>AI-Optimized Code</CardTitle>
                </div>
                {optimizedCode && !isOptimizing && (
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
              <CardDescription>
                {isOptimizing 
                  ? 'Generating optimized version based on analysis...'
                  : 'Refactored code following best practices and recommendations'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              {isOptimizing ? (
                <div className="flex items-center justify-center min-h-[300px]">
                  <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                    <p className="text-sm text-muted-foreground">AI is optimizing your code...</p>
                  </div>
                </div>
              ) : optimizedCode ? (
                <div className="space-y-4">
                  <div className="relative">
                    <pre className="bg-input border border-border rounded-lg p-4 overflow-x-auto">
                      <code className="text-sm font-mono text-foreground">{optimizedCode}</code>
                    </pre>
                  </div>
                  <div className="flex items-start gap-2 p-4 bg-success/10 border border-success/20 rounded-lg">
                    <Sparkles className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground">
                      This optimized version addresses the identified issues while maintaining functionality.
                      Review the changes and integrate them into your codebase.
                    </p>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};