import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WorkflowStep {
  id: string;
  name: string;
  status: 'completed' | 'current' | 'pending';
}

interface WorkflowStepperProps {
  steps: WorkflowStep[];
}

export const WorkflowStepper = ({ steps }: WorkflowStepperProps) => {
  return (
    <div className="w-full">
      <nav aria-label="Progress">
        <ol role="list" className="flex items-center justify-between">
          {steps.map((step, stepIdx) => (
            <li
              key={step.id}
              className={cn(
                stepIdx !== steps.length - 1 ? 'flex-1' : '',
                'relative flex items-center'
              )}
            >
              {step.status === 'completed' ? (
                <>
                  <div className="flex items-center">
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-approved">
                      <Check className="h-5 w-5 text-white" aria-hidden="true" />
                    </div>
                    <span className="ml-3 text-sm font-medium text-foreground">
                      {step.name}
                    </span>
                  </div>
                  {stepIdx !== steps.length - 1 && (
                    <div className="ml-4 flex-1 border-t-2 border-approved" />
                  )}
                </>
              ) : step.status === 'current' ? (
                <>
                  <div className="flex items-center">
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background">
                      <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                    </div>
                    <span className="ml-3 text-sm font-medium text-primary">
                      {step.name}
                    </span>
                  </div>
                  {stepIdx !== steps.length - 1 && (
                    <div className="ml-4 flex-1 border-t-2 border-muted" />
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center">
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-muted bg-background">
                      <span className="h-2.5 w-2.5 rounded-full bg-muted" />
                    </div>
                    <span className="ml-3 text-sm font-medium text-muted-foreground">
                      {step.name}
                    </span>
                  </div>
                  {stepIdx !== steps.length - 1 && (
                    <div className="ml-4 flex-1 border-t-2 border-muted" />
                  )}
                </>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
};
