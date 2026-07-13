-- Create tasks/to-do list table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Tasks are viewable by authenticated users" 
ON public.tasks 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create tasks" 
ON public.tasks 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update tasks" 
ON public.tasks 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete tasks" 
ON public.tasks 
FOR DELETE 
TO authenticated
USING (true);

-- Insert the email notifications task
INSERT INTO public.tasks (title, description, priority, status, category)
VALUES (
  'Email Notifications System',
  'Implement email notifications using Resend for: incident alerts, staff status changes, patrol completion reports, daily operational summaries, and SLA breach alerts',
  'high',
  'pending',
  'system_enhancement'
);