import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Dumbbell,
  ArrowRight,
  ChevronDown,
  Clock,
  Flame
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { InterviewType, Difficulty, SessionConfig } from '@/types';
import { INTERVIEW_TYPE_INFO, DIFFICULTY_INFO } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ALL_INTERVIEW_TYPES: InterviewType[] = [
  'behavioral', 'product_sense', 'product_design', 'rca',
  'guesstimate', 'tech', 'ai_ml', 'strategy', 'metrics'
];

const SESSION_LENGTHS = [
  { value: 1, label: 'Single question', description: 'Quick practice' },
  { value: 3, label: '3 questions', description: '~45 min session' },
  { value: 5, label: '5 questions', description: '~75 min session' },
  { value: 9, label: 'Full mock', description: 'One of each type' },
] as const;

const TIMER_MODES = [
  { value: 'none', label: 'No timer', description: 'Practice at your own pace' },
  { value: 'relaxed', label: 'Relaxed', description: '2x suggested time' },
  { value: 'standard', label: 'Standard', description: 'Suggested time' },
  { value: 'pressure', label: 'Pressure', description: '0.75x time' },
] as const;

export default function Practice() {
  const [config, setConfig] = useState<SessionConfig>({
    company: null,
    interview_types: [],
    difficulty: 'medium',
    session_length: 3,
    timer_mode: 'none',
  });
  
  const toggleInterviewType = (type: InterviewType) => {
    setConfig(prev => {
      const types = prev.interview_types.includes(type)
        ? prev.interview_types.filter(t => t !== type)
        : [...prev.interview_types, type];
      return { ...prev, interview_types: types.length > 0 ? types : [type] };
    });
  };
  
  const selectAllTypes = () => {
    setConfig(prev => ({ ...prev, interview_types: [...ALL_INTERVIEW_TYPES] }));
  };
  
  return (
    <Layout>
      <div className="container py-8 md:py-12 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 text-primary mb-4">
            <Dumbbell className="h-8 w-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Configure Your Session</h1>
          <p className="text-muted-foreground">
            Customize your practice session or jump in with defaults
          </p>
        </div>
        
        <div className="space-y-8">
          {/* Interview Types */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Interview Types</label>
              <button
                onClick={selectAllTypes}
                className="text-xs text-primary hover:underline"
              >
                Select all
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {ALL_INTERVIEW_TYPES.map((type) => {
                const info = INTERVIEW_TYPE_INFO[type];
                const isSelected = config.interview_types.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleInterviewType(type)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all',
                      isSelected
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-card hover:border-primary/30'
                    )}
                  >
                    <span className="text-xl">{info.icon}</span>
                    <span className="text-xs font-medium text-center leading-tight">
                      {info.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Difficulty */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Difficulty</label>
            <div className="grid grid-cols-3 gap-2">
              {(['medium', 'hard', 'expert'] as Difficulty[]).map((diff) => {
                const info = DIFFICULTY_INFO[diff];
                const isSelected = config.difficulty === diff;
                return (
                  <button
                    key={diff}
                    onClick={() => setConfig(prev => ({ ...prev, difficulty: diff }))}
                    className={cn(
                      'flex items-center justify-center gap-2 py-3 px-4 rounded-lg border transition-all font-medium',
                      isSelected
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-card hover:border-primary/30'
                    )}
                  >
                    {diff === 'expert' && <Flame className="h-4 w-4" />}
                    {info.label}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Session Length */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Session Length</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {SESSION_LENGTHS.map((opt) => {
                const isSelected = config.session_length === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setConfig(prev => ({ ...prev, session_length: opt.value as 1 | 3 | 5 | 9 }))}
                    className={cn(
                      'flex flex-col items-center gap-1 py-3 px-4 rounded-lg border transition-all',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:border-primary/30'
                    )}
                  >
                    <span className={cn('font-semibold', isSelected && 'text-primary')}>
                      {opt.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{opt.description}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Timer Mode */}
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Timer (optional)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {TIMER_MODES.map((mode) => {
                const isSelected = config.timer_mode === mode.value;
                return (
                  <button
                    key={mode.value}
                    onClick={() => setConfig(prev => ({ ...prev, timer_mode: mode.value as 'none' | 'relaxed' | 'standard' | 'pressure' }))}
                    className={cn(
                      'flex flex-col items-center gap-1 py-3 px-4 rounded-lg border transition-all',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:border-primary/30'
                    )}
                  >
                    <span className={cn('font-semibold', isSelected && 'text-primary')}>
                      {mode.label}
                    </span>
                    <span className="text-xs text-muted-foreground text-center">{mode.description}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Company Filter (Optional) */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Focus Company (optional)</label>
            <Select 
              value={config.company || 'all'}
              onValueChange={(value) => setConfig(prev => ({ ...prev, company: value === 'all' ? null : value }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All companies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All companies</SelectItem>
                <SelectItem value="airbnb">Airbnb</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="slack">Slack</SelectItem>
                <SelectItem value="spotify">Spotify</SelectItem>
                <SelectItem value="notion">Notion</SelectItem>
                <SelectItem value="figma">Figma</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Start Button */}
          <div className="pt-4">
            <Link to="/practice/session" state={{ config }}>
              <Button 
                size="lg" 
                className="w-full btn-primary-gradient gap-2 h-14 text-lg"
              >
                <Dumbbell className="h-5 w-5" />
                Enter the Dojo
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            
            <p className="text-center text-sm text-muted-foreground mt-3">
              {config.session_length} {config.session_length === 1 ? 'question' : 'questions'} • 
              {' '}{config.interview_types.length} {config.interview_types.length === 1 ? 'type' : 'types'} • 
              {' '}{DIFFICULTY_INFO[config.difficulty].label}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
