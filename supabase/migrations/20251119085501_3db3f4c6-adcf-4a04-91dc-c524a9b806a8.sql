-- Create WhatsApp messages table
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_number TEXT NOT NULL,
  recipient_number TEXT,
  message_text TEXT NOT NULL,
  is_incoming BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'delivered',
  ticket_id UUID REFERENCES public.communication_tickets(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ
);

-- Create SMS messages table
CREATE TABLE IF NOT EXISTS public.sms_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_number TEXT NOT NULL,
  recipient_number TEXT NOT NULL,
  message_text TEXT NOT NULL,
  is_incoming BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'delivered',
  ticket_id UUID REFERENCES public.communication_tickets(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to view all messages
CREATE POLICY "Allow authenticated users to view WhatsApp messages"
  ON public.whatsapp_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert WhatsApp messages"
  ON public.whatsapp_messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to view SMS messages"
  ON public.sms_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert SMS messages"
  ON public.sms_messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_whatsapp_messages_created_at ON public.whatsapp_messages(created_at DESC);
CREATE INDEX idx_whatsapp_messages_ticket_id ON public.whatsapp_messages(ticket_id);
CREATE INDEX idx_sms_messages_created_at ON public.sms_messages(created_at DESC);
CREATE INDEX idx_sms_messages_ticket_id ON public.sms_messages(ticket_id);